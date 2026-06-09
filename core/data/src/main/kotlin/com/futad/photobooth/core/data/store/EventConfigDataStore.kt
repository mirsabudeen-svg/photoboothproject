package com.futad.photobooth.core.data.store

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

private val Context.eventConfigStore by preferencesDataStore("event_config")

@Singleton
class EventConfigDataStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val dataStore: DataStore<Preferences> = context.eventConfigStore
    private val json = Json { ignoreUnknownKeys = true }

    val configJsonFlow: Flow<String?> = dataStore.data.map { it[CONFIG_JSON_KEY] }
    val versionFlow: Flow<Int> = dataStore.data.map { it[VERSION_KEY] ?: 0 }

    suspend fun save(configJson: String, version: Int) {
        dataStore.edit {
            it[CONFIG_JSON_KEY] = configJson
            it[VERSION_KEY] = version
        }
    }

    suspend fun getVersion(): Int = dataStore.data.first()[VERSION_KEY] ?: 0

    suspend fun getConfigJson(): String? = dataStore.data.first()[CONFIG_JSON_KEY]
}

private val CONFIG_JSON_KEY = stringPreferencesKey("config_json")
private val VERSION_KEY = intPreferencesKey("config_version")
