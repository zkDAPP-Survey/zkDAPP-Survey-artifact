package ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import at.asitplus.valera.resources.Res
import at.asitplus.valera.resources.snackbar_zkissuer_request_submitted
import at.asitplus.wallet.app.common.WalletMain
import at.asitplus.wallet.app.common.zkissuer.ZkIssuerDocumentScanService
import at.asitplus.wallet.app.common.zkissuer.ZkIssuerCredentialTypeDto
import at.asitplus.wallet.app.common.zkissuer.ZkIssuerService
import io.github.aakira.napier.Napier
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.getString

class LoadWithZkIssuerViewModel(
    private val walletMain: WalletMain,
    private val zkIssuerService: ZkIssuerService,
    private val documentScanService: ZkIssuerDocumentScanService,
) : ViewModel() {
    private val _uiState = MutableStateFlow(LoadWithZkIssuerUiState())
    val uiState: StateFlow<LoadWithZkIssuerUiState> = _uiState.asStateFlow()

    init {
        loadCredentialTypes()
    }

    fun loadCredentialTypes() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            runCatching {
                zkIssuerService.listCredentialTypeNames()
            }.onSuccess { names ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    credentialTypeNames = names,
                    selectedCredentialType = null,
                    selectedCredentialTypeDetails = null,
                    claimValues = emptyMap(),
                    attachments = emptyList(),
                    scannedAttachmentIndex = null,
                )
            }.onFailure { error ->
                Napier.w("ZkIssuer: failed to load credential type names", error)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = error.message ?: error::class.simpleName ?: "Failed to load credential types",
                )
            }
        }
    }

    fun selectCredentialType(typeName: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                selectedCredentialType = typeName,
                selectedCredentialTypeDetails = null,
                claimValues = emptyMap(),
                attachments = emptyList(),
                scannedAttachmentIndex = null,
                errorMessage = null,
            )
            loadCredentialTypeDetails(typeName)
        }
    }

    fun updateClaimValue(key: String, value: String) {
        _uiState.value = _uiState.value.copy(
            claimValues = _uiState.value.claimValues + (key to value),
        )
    }

    fun addAttachment(imageBytes: ByteArray?) {
        if (imageBytes != null) {
            _uiState.value = _uiState.value.copy(
                attachments = _uiState.value.attachments + imageBytes,
            )
        }
    }

    fun addAttachments(imageBytes: List<ByteArray>) {
        if (imageBytes.isNotEmpty()) {
            _uiState.value = _uiState.value.copy(
                attachments = _uiState.value.attachments + imageBytes,
            )
        }
    }

    fun replaceScannedAttachment(imageBytes: ByteArray) {
        val state = _uiState.value
        val scannedIndex = state.scannedAttachmentIndex
        val updatedAttachments = when {
            scannedIndex == null -> listOf(imageBytes) + state.attachments
            scannedIndex in state.attachments.indices -> state.attachments.toMutableList().also { it[scannedIndex] = imageBytes }
            else -> listOf(imageBytes) + state.attachments
        }

        _uiState.value = state.copy(
            attachments = updatedAttachments,
            scannedAttachmentIndex = 0,
        )
    }

    fun removeAttachment(index: Int) {
        val scannedIndex = _uiState.value.scannedAttachmentIndex
        val adjustedScannedIndex = when {
            scannedIndex == null -> null
            index == scannedIndex -> null
            index < scannedIndex -> scannedIndex - 1
            else -> scannedIndex
        }
        _uiState.value = _uiState.value.copy(
            attachments = _uiState.value.attachments.filterIndexed { i, _ -> i != index },
            scannedAttachmentIndex = adjustedScannedIndex,
        )
    }

    fun applyScannedDocumentText(scannedText: String) {
        val state = _uiState.value
        val claimKeys = state.selectedCredentialTypeDetails?.requiredClaimKeys.orEmpty()
        if (claimKeys.isEmpty()) return

        val extractedValues = documentScanService.extractClaimValues(scannedText, claimKeys)
        if (extractedValues.isEmpty()) {
            _uiState.value = state.copy(
                errorMessage = "No matching document data was detected",
            )
            return
        }

        _uiState.value = state.copy(
            claimValues = state.claimValues + extractedValues,
            errorMessage = null,
        )
    }

    fun submit(onSuccess: () -> Unit) {
        val selectedType = _uiState.value.selectedCredentialType
        val claimValues = _uiState.value.claimValues
        val attachments = _uiState.value.attachments
        if (selectedType.isNullOrBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please select a credential type")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, errorMessage = null)
            runCatching {
                zkIssuerService.createCredentialRequest(
                    credentialType = selectedType,
                    claims = claimValues,
                    attachments = attachments,
                )
            }.onSuccess { response ->
                Napier.d("ZkIssuer: created credential request transactionId=${response.transactionId} status=${response.status}")
                walletMain.zkIssuerPollingService.trackPendingRequest(
                    transactionId = response.transactionId,
                    credentialType = selectedType,
                    claims = claimValues,
                )
                walletMain.snackbarService.showSnackbar(getString(Res.string.snackbar_zkissuer_request_submitted))
                _uiState.value = _uiState.value.copy(isSubmitting = false)
                onSuccess()
            }.onFailure { error ->
                Napier.w("ZkIssuer: failed to create credential request", error)
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    errorMessage = error.message ?: error::class.simpleName ?: "Failed to submit ZkIssuer request",
                )
            }
        }
    }

    private suspend fun loadCredentialTypeDetails(typeName: String) {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
        runCatching {
            zkIssuerService.getCredentialType(typeName)
        }.onSuccess { details ->
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                selectedCredentialTypeDetails = details,
                claimValues = details.requiredClaimKeys.associateWith { _uiState.value.claimValues[it] ?: "" },
            )
        }.onFailure { error ->
            Napier.w("ZkIssuer: failed to load credential type details for $typeName", error)
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                errorMessage = error.message ?: error::class.simpleName ?: "Failed to load credential type",
            )
        }
    }
}

data class LoadWithZkIssuerUiState(
    val isLoading: Boolean = true,
    val credentialTypeNames: List<String> = emptyList(),
    val selectedCredentialType: String? = null,
    val selectedCredentialTypeDetails: ZkIssuerCredentialTypeDto? = null,
    val claimValues: Map<String, String> = emptyMap(),
    val attachments: List<ByteArray> = emptyList(),
    val scannedAttachmentIndex: Int? = null,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
)
