package com.futad.photobooth.feature.sync.storage

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.credentialsDataStore by preferencesDataStore("device_credentials")

data class DeviceCredentials(
    val deviceId: String,
    val accessToken: String,
)

@Singleton
class DeviceCredentialsStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val deviceIdKey = stringPreferencesKey("device_id")
    private val tokenKey = stringPreferencesKey("access_token")

    suspend fun save(credentials: DeviceCredentials) {
        context.credentialsDataStore.edit { prefs ->
            prefs[deviceIdKey] = credentials.deviceId
            prefs[tokenKey] = credentials.accessToken
        }
    }

    suspend fun get(): DeviceCredentials? {
        val prefs = context.credentialsDataStore.data.first()
        val deviceId = prefs[deviceIdKey] ?: return null
        val token = prefs[tokenKey] ?: return null
        return DeviceCredentials(deviceId, token)
    }
}
