package com.futad.photobooth.core.data.repository

import com.futad.photobooth.core.data.store.DeviceCredentialsStore
import com.futad.photobooth.core.network.PhotoboothApi
import com.futad.photobooth.core.network.dto.EventConfigResponse
import com.futad.photobooth.core.network.dto.PairDeviceRequest
import com.futad.photobooth.core.network.dto.PairDeviceResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DevicesRepository @Inject constructor(
    private val api: PhotoboothApi,
    private val credentialsStore: DeviceCredentialsStore,
) {
    suspend fun pair(
        pairingCode: String,
        deviceName: String,
        deviceModel: String,
        appVersion: String,
        osVersion: String,
    ): PairDeviceResponse {
        val response = api.pairDevice(
            PairDeviceRequest(
                pairingCode = pairingCode,
                deviceName = deviceName,
                deviceModel = deviceModel,
            ),
        )
        credentialsStore.saveToken(response.accessToken, response.deviceId)
        return response
    }

    suspend fun bearerToken(): String? = credentialsStore.getToken()?.let { "Bearer $it" }

    suspend fun isPaired(): Boolean = credentialsStore.isPaired()

    suspend fun unpair() = credentialsStore.clear()
}

@Singleton
class RemoteEventsRepository @Inject constructor(
    private val api: PhotoboothApi,
    private val credentialsStore: DeviceCredentialsStore,
) {
    suspend fun fetchConfig(eventId: String): EventConfigResponse {
        val token = credentialsStore.getToken() ?: throw IllegalStateException("Device not paired")
        return api.getEventConfig("Bearer $token", eventId)
    }
}
