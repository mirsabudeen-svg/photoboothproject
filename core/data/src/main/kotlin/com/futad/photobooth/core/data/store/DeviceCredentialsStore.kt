package com.futad.photobooth.core.data.store

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.deviceCredentialsStore by preferencesDataStore("device_credentials")

@Singleton
class DeviceCredentialsStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val dataStore: DataStore<Preferences> = context.deviceCredentialsStore
    private val tokenRefresh = MutableStateFlow(0)

    private val securePrefs by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "device_credentials_secure",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    val tokenFlow: Flow<String?> = tokenRefresh.flatMapLatest {
        flow { emit(getToken()) }
    }
    val deviceIdFlow: Flow<String?> = dataStore.data.map { it[DEVICE_ID_KEY] }
    val activeEventIdFlow: Flow<String?> = dataStore.data.map { it[ACTIVE_EVENT_ID_KEY] }

    suspend fun saveToken(token: String, deviceId: String) {
        migrateIfNeeded()
        securePrefs.edit()
            .putString(KEY_TOKEN, token)
            .apply()
        dataStore.edit {
            it[DEVICE_ID_KEY] = deviceId
            it[TOKEN_PRESENT_KEY] = true
            it.remove(LEGACY_TOKEN_KEY)
        }
        tokenRefresh.value++
    }

    suspend fun saveTokenExpiresAt(expiresAtIso: String) {
        migrateIfNeeded()
        val millis = java.time.Instant.parse(expiresAtIso).toEpochMilli()
        securePrefs.edit().putLong(KEY_EXPIRES, millis).apply()
        dataStore.edit {
            it[TOKEN_EXPIRES_AT_KEY] = millis
            it.remove(LEGACY_TOKEN_KEY)
        }
    }

    suspend fun getToken(): String? {
        migrateIfNeeded()
        return securePrefs.getString(KEY_TOKEN, null)
    }

    suspend fun getDeviceId(): String? = dataStore.data.first()[DEVICE_ID_KEY]

    suspend fun getTokenExpiresAt(): Long? {
        migrateIfNeeded()
        return securePrefs.getLong(KEY_EXPIRES, 0L).takeIf { it > 0L }
            ?: dataStore.data.first()[TOKEN_EXPIRES_AT_KEY]
    }

    suspend fun isPaired(): Boolean = getToken() != null

    suspend fun setActiveEventId(eventId: String) {
        dataStore.edit { it[ACTIVE_EVENT_ID_KEY] = eventId }
    }

    suspend fun getActiveEventId(): String? = dataStore.data.first()[ACTIVE_EVENT_ID_KEY]

    suspend fun setCompanionHostIp(ip: String) {
        dataStore.edit { it[COMPANION_HOST_IP_KEY] = ip.trim() }
    }

    suspend fun getCompanionHostIp(): String? =
        dataStore.data.first()[COMPANION_HOST_IP_KEY]?.takeIf { it.isNotBlank() }

    suspend fun setCompanionPrintToken(token: String) {
        dataStore.edit { it[COMPANION_PRINT_TOKEN_KEY] = token.trim() }
    }

    suspend fun getCompanionPrintToken(): String? =
        dataStore.data.first()[COMPANION_PRINT_TOKEN_KEY]?.takeIf { it.isNotBlank() }

    suspend fun clear() {
        securePrefs.edit().clear().apply()
        dataStore.edit { it.clear() }
        tokenRefresh.value++
    }

    private suspend fun migrateIfNeeded() {
        if (securePrefs.contains(KEY_TOKEN)) return
        val legacy = dataStore.data.first()
        val oldToken = legacy[LEGACY_TOKEN_KEY] ?: return
        securePrefs.edit().putString(KEY_TOKEN, oldToken).apply()
        legacy[TOKEN_EXPIRES_AT_KEY]?.let { securePrefs.edit().putLong(KEY_EXPIRES, it).apply() }
        dataStore.edit {
            it.remove(LEGACY_TOKEN_KEY)
            it[TOKEN_PRESENT_KEY] = true
        }
        tokenRefresh.value++
    }

    companion object {
        private const val KEY_TOKEN = "access_token"
        private const val KEY_EXPIRES = "token_expires_at"
        private val LEGACY_TOKEN_KEY = stringPreferencesKey("device_token")
        private val DEVICE_ID_KEY = stringPreferencesKey("device_id")
        private val ACTIVE_EVENT_ID_KEY = stringPreferencesKey("active_event_id")
        private val TOKEN_EXPIRES_AT_KEY = longPreferencesKey("token_expires_at")
        private val TOKEN_PRESENT_KEY = booleanPreferencesKey("token_present")
        private val COMPANION_HOST_IP_KEY = stringPreferencesKey("companion_host_ip")
        private val COMPANION_PRINT_TOKEN_KEY = stringPreferencesKey("companion_print_token")
    }
}
