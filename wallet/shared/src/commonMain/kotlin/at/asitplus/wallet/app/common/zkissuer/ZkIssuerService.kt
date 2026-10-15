package at.asitplus.wallet.app.common.zkissuer

import at.asitplus.wallet.app.common.HttpService
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.encodeURLPath
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.put
import kotlinx.serialization.json.JsonPrimitive
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

@Serializable
data class ZkIssuerCredentialTypeNamesResponseDto(
    val credentialTypes: List<String>,
)

@Serializable
data class ZkIssuerCredentialTypeDto(
    val typeName: String,
    val requiredClaimKeys: List<String>,
)

@Serializable
data class ZkIssuerCreateCredentialRequestDto(
    val credentialType: String,
    val claims: Map<String, String>,
    val proof: String? = null,
)

@Serializable
data class ZkIssuerCredentialRequestResponseDto(
    val id: Int,
    val transactionId: String,
    val status: ZkIssuerCredentialRequestStatus,
)

@Serializable
data class ZkIssuerCredentialOfferDto(
    val transactionId: String,
    val status: ZkIssuerCredentialRequestStatus,
    val credential: String? = null,
)

@Serializable
enum class ZkIssuerCredentialRequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    EXPIRED,
}

class ZkIssuerService(
    private val httpService: HttpService,
) {
    private val baseUrl = "https://issuer.example.org"

    suspend fun listCredentialTypeNames(): List<String> = httpService.buildHttpClient().use { client ->
        client.get("$baseUrl/api/credentials/types/names").body<ZkIssuerCredentialTypeNamesResponseDto>().credentialTypes
    }

    suspend fun getCredentialType(typeName: String): ZkIssuerCredentialTypeDto = httpService.buildHttpClient().use { client ->
        client.get("$baseUrl/api/credentials/types/${typeName.encodeURLPath()}").body()
    }

    @OptIn(ExperimentalEncodingApi::class)
    suspend fun createCredentialRequest(
        credentialType: String,
        claims: Map<String, String>,
        attachments: List<ByteArray> = emptyList(),
        proof: String? = null,
    ): ZkIssuerCredentialRequestResponseDto = httpService.buildHttpClient().use { client ->
        client.post("$baseUrl/api/credentials/requests") {
            setBody(
                buildJsonObject {
                    put("credentialType", credentialType)
                    put(
                        "claims",
                        buildJsonObject {
                            claims.forEach { (key, value) ->
                                put(key, value)
                            }
                        }
                    )
                    if (attachments.isNotEmpty()) {
                        put(
                            "attachments",
                            buildJsonArray {
                                attachments.forEach { bytes ->
                                    add(JsonPrimitive(Base64.encode(bytes)))
                                }
                            }
                        )
                    }
                    proof?.takeIf { it.isNotBlank() }?.let { put("proof", it) }
                }
            )
        }.body()
    }

    suspend fun getCredentialOffer(transactionId: String): ZkIssuerCredentialOfferDto = httpService.buildHttpClient().use { client ->
        client.get("$baseUrl/api/credentials/offers/${transactionId.encodeURLPath()}").body()
    }
}

