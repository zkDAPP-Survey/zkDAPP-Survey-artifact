package at.asitplus.wallet.app.common.zkissuer

import at.asitplus.wallet.app.common.Configuration
import at.asitplus.wallet.app.common.ErrorService
import at.asitplus.wallet.app.common.SnackbarService
import at.asitplus.wallet.lib.agent.SdJwtDecoded
import at.asitplus.wallet.lib.agent.SubjectCredentialStore
import at.asitplus.wallet.lib.data.AttributeIndex
import at.asitplus.wallet.lib.data.SdJwtFallbackCredentialScheme
import at.asitplus.wallet.lib.data.VerifiableCredentialSdJwt
import at.asitplus.wallet.lib.data.vckJsonSerializer
import at.asitplus.wallet.lib.jws.SdJwtSigned
import data.storage.DataStoreService
import data.storage.WalletSubjectCredentialStore
import io.github.aakira.napier.Napier
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromJsonElement
import kotlin.time.Clock
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

@Serializable
private data class PendingZkIssuerRequest(
    val transactionId: String,
    val credentialType: String,
    val claims: Map<String, String> = emptyMap(),
    val attemptsDone: Int = 0,
    val submittedAtEpochMillis: Long = Clock.System.now().toEpochMilliseconds(),
)

private const val ZkIssuerApprovedMessage = "ZkIssuer credential approved and added to your wallet."
private const val ZkIssuerRejectedMessage = "ZkIssuer request was rejected."
private const val ZkIssuerExpiredMessage = "ZkIssuer request expired before approval."
private const val ZkIssuerTimedOutMessage = "ZkIssuer request timed out before approval."

class ZkIssuerPollingService(
    private val dataStoreService: DataStoreService,
    private val subjectCredentialStore: WalletSubjectCredentialStore,
    private val zkIssuerService: ZkIssuerService,
    private val errorService: ErrorService,
    private val snackbarService: SnackbarService,
) {
    private val scope = CoroutineScope(
        SupervisorJob() + Dispatchers.Default + CoroutineName("ZkIssuerPollingService")
    )
    private val jobs = mutableMapOf<String, Job>()
    private val mutex = Mutex()

    fun resumePendingRequests() {
        scope.launch {
            loadPendingRequests().forEach { startPolling(it) }
        }
    }

    fun trackPendingRequest(
        transactionId: String,
        credentialType: String,
        claims: Map<String, String> = emptyMap(),
    ) {
        scope.launch {
            val pendingRequest = PendingZkIssuerRequest(
                transactionId = transactionId,
                credentialType = credentialType,
                claims = claims,
            )
            savePendingRequest(pendingRequest)
            startPolling(pendingRequest)
        }
    }

    suspend fun reset() {
        mutex.withLock {
            jobs.values.forEach { it.cancel() }
            jobs.clear()
        }
        dataStoreService.deletePreference(Configuration.DATASTORE_KEY_ZkIssuer_PENDING_REQUESTS)
    }

    private suspend fun startPolling(pendingRequest: PendingZkIssuerRequest) {
        mutex.withLock {
            if (jobs[pendingRequest.transactionId]?.isActive == true) return
            jobs[pendingRequest.transactionId] = scope.launch {
                pollUntilResolved(pendingRequest)
            }
        }
    }

    private suspend fun pollUntilResolved(initialRequest: PendingZkIssuerRequest) {
        var currentRequest = initialRequest
        while (isPollingActive() && currentRequest.attemptsDone < 10) {
            val nextAttempt = currentRequest.attemptsDone + 1
            currentRequest = currentRequest.copy(attemptsDone = nextAttempt)
            savePendingRequest(currentRequest)

            runCatching {
                zkIssuerService.getCredentialOffer(currentRequest.transactionId)
            }.onFailure { error ->
                Napier.w(
                    "ZkIssuer: polling failed for transactionId=${currentRequest.transactionId} attempt=$nextAttempt",
                    error,
                )
                errorService.emit(error)
                if (isPollingActive() && nextAttempt < 20) {
                    delay(30.seconds)
                }
            }.onSuccess { offer ->
                Napier.d(
                    "ZkIssuer: polled transactionId=${currentRequest.transactionId} status=${offer.status} attempt=$nextAttempt"
                )
                when (offer.status) {
                    ZkIssuerCredentialRequestStatus.PENDING -> {
                        if (nextAttempt < 10) {
                            delay(30.seconds)
                        } else {
                            clearPendingRequest(currentRequest.transactionId)
                            snackbarService.showSnackbar(ZkIssuerTimedOutMessage)
                        }
                    }

                    ZkIssuerCredentialRequestStatus.APPROVED -> {
                        val credential = offer.credential
                        if (credential.isNullOrBlank()) {
                            clearPendingRequest(currentRequest.transactionId)
                            errorService.emit(IllegalStateException("ZkIssuer approved without credential payload"))
                            return
                        }
                        importApprovedCredential(credential)
                        clearPendingRequest(currentRequest.transactionId)
                        snackbarService.showSnackbar(ZkIssuerApprovedMessage)
                        return
                    }

                    ZkIssuerCredentialRequestStatus.REJECTED -> {
                        clearPendingRequest(currentRequest.transactionId)
                        snackbarService.showSnackbar(ZkIssuerRejectedMessage)
                        return
                    }

                    ZkIssuerCredentialRequestStatus.EXPIRED -> {
                        clearPendingRequest(currentRequest.transactionId)
                        snackbarService.showSnackbar(ZkIssuerExpiredMessage)
                        return
                    }
                }
            }
        }

        if (isPollingActive()) {
            clearPendingRequest(initialRequest.transactionId)
            snackbarService.showSnackbar(ZkIssuerTimedOutMessage)
        }
    }

    private suspend fun isPollingActive(): Boolean = currentCoroutineContext()[Job]?.isActive == true

    private suspend fun importApprovedCredential(serializedCredential: String) {
        runCatching {
            val sdJwtImportJson = Json { ignoreUnknownKeys = true }

            val parsed = SdJwtSigned.parseCatching(serializedCredential).onFailure {
                Napier.e("SD-JWT import: parse failed", it)
            }.getOrThrow()

            val decoded = SdJwtDecoded(parsed)
            val payload = decoded.reconstructedJsonObject
                ?: error("SD-JWT payload could not be reconstructed")

            val sdJwt = sdJwtImportJson.decodeFromJsonElement<VerifiableCredentialSdJwt>(payload)
            Napier.d("SD-JWT import: decoded vc type='${sdJwt.verifiableCredentialType}'")

            val scheme = AttributeIndex.resolveSdJwtAttributeType(sdJwt.verifiableCredentialType)
                ?: SdJwtFallbackCredentialScheme
            Napier.d("SD-JWT import: resolved scheme='${scheme.schemaUri}'")

            val store = subjectCredentialStore as? SubjectCredentialStore
                ?: error("SubjectCredentialStore is not available for direct import")

            store.storeCredential(
                vc = sdJwt,
                vcSerialized = serializedCredential,
                disclosures = decoded.validDisclosures,
                scheme = scheme,
            )
            Napier.d("SD-JWT import: credential stored successfully")
        }.onFailure { error ->
            errorService.emit(error)
            throw error
        }
    }

    private suspend fun loadPendingRequests(): List<PendingZkIssuerRequest> = runCatching {
        dataStoreService.getPreference(Configuration.DATASTORE_KEY_ZkIssuer_PENDING_REQUESTS)
            .firstOrNull()
            ?.let { vckJsonSerializer.decodeFromString<List<PendingZkIssuerRequest>>(it) }
            .orEmpty()
    }.getOrElse {
        Napier.w("ZkIssuer: failed to load pending requests", it)
        emptyList<PendingZkIssuerRequest>()
    }

    private suspend fun savePendingRequest(pendingRequest: PendingZkIssuerRequest) {
        val pendingRequests = loadPendingRequests().filterNot { it.transactionId == pendingRequest.transactionId } + pendingRequest
        dataStoreService.setPreference(
            key = Configuration.DATASTORE_KEY_ZkIssuer_PENDING_REQUESTS,
            value = vckJsonSerializer.encodeToString(pendingRequests),
        )
    }

    private suspend fun clearPendingRequest(transactionId: String) {
        val remaining = loadPendingRequests().filterNot { it.transactionId == transactionId }
        if (remaining.isEmpty()) {
            dataStoreService.deletePreference(Configuration.DATASTORE_KEY_ZkIssuer_PENDING_REQUESTS)
        } else {
            dataStoreService.setPreference(
                key = Configuration.DATASTORE_KEY_ZkIssuer_PENDING_REQUESTS,
                value = vckJsonSerializer.encodeToString(remaining),
            )
        }
        mutex.withLock { jobs.remove(transactionId) }
    }
}
