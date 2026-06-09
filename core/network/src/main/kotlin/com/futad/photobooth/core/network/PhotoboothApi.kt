package com.futad.photobooth.core.network

import com.futad.photobooth.core.network.dto.AnalyticsBatchRequest
import com.futad.photobooth.core.network.dto.CompleteCaptureRequest
import com.futad.photobooth.core.network.dto.CompleteCaptureResponse
import com.futad.photobooth.core.network.dto.CreateCaptureRequest
import com.futad.photobooth.core.network.dto.CreateCaptureResponse
import com.futad.photobooth.core.network.dto.CreateShareRequest
import com.futad.photobooth.core.network.dto.EventConfigResponse
import com.futad.photobooth.core.network.dto.PairDeviceRequest
import com.futad.photobooth.core.network.dto.PairDeviceResponse
import com.futad.photobooth.core.network.dto.RefreshTokenResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

interface PhotoboothApi {
    @POST("devices/pair")
    suspend fun pairDevice(@Body request: PairDeviceRequest): PairDeviceResponse

    @POST("devices/token/refresh")
    suspend fun refreshDeviceToken(@Header("Authorization") auth: String): RefreshTokenResponse

    @GET("events/{eventId}/config")
    suspend fun getEventConfig(
        @Header("Authorization") auth: String,
        @Path("eventId") eventId: String,
    ): EventConfigResponse

    @POST("captures")
    suspend fun createCapture(
        @Header("Authorization") auth: String,
        @Body request: CreateCaptureRequest,
    ): CreateCaptureResponse

    @POST("captures/{captureId}/complete")
    suspend fun completeCapture(
        @Header("Authorization") auth: String,
        @Path("captureId") captureId: String,
        @Body request: CompleteCaptureRequest,
    ): CompleteCaptureResponse

    @POST("shares")
    suspend fun createShare(
        @Header("Authorization") auth: String,
        @Body request: CreateShareRequest,
    ): Unit

    @POST("analytics/batch")
    suspend fun submitAnalytics(
        @Header("Authorization") auth: String,
        @Body request: AnalyticsBatchRequest,
    ): Unit
}
