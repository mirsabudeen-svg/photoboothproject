package com.futad.photobooth.di

import android.content.Context
import androidx.room.Room
import com.futad.photobooth.BuildConfig
import com.futad.photobooth.core.data.repository.CaptureRepositoryImpl
import com.futad.photobooth.core.data.repository.ConsentRepositoryImpl
import com.futad.photobooth.core.data.repository.EventRepositoryImpl
import com.futad.photobooth.core.data.repository.PrintRepositoryImpl
import com.futad.photobooth.core.data.repository.ShareRepositoryImpl
import com.futad.photobooth.core.database.KeystoreHelper
import com.futad.photobooth.core.database.PhotoboothDatabase
import com.futad.photobooth.core.domain.repository.CaptureRepository
import com.futad.photobooth.core.domain.repository.ConsentRepository
import com.futad.photobooth.core.domain.repository.EventRepository
import com.futad.photobooth.core.domain.repository.PrintRepository
import com.futad.photobooth.core.domain.repository.ShareRepository
import com.futad.photobooth.core.domain.usecase.EnqueueShareUseCase
import com.futad.photobooth.core.domain.usecase.SaveCaptureUseCase
import com.futad.photobooth.core.network.PhotoboothApi
import com.futad.photobooth.hardware.camera.CameraController
import com.futad.photobooth.hardware.camera.CameraXController
import com.futad.photobooth.hardware.printer.EscPosPrinter
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import net.sqlcipher.database.SupportFactory
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideOkHttp(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
        return OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit {
        val json = Json { ignoreUnknownKeys = true }
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideApi(retrofit: Retrofit): PhotoboothApi = retrofit.create(PhotoboothApi::class.java)

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): PhotoboothDatabase {
        val passphrase = KeystoreHelper.getOrCreateDatabasePassphrase(context)
        val factory = SupportFactory(passphrase)
        return Room.databaseBuilder(context, PhotoboothDatabase::class.java, "photobooth.db")
            .openHelperFactory(factory)
            .build()
    }

    @Provides fun provideEventDao(db: PhotoboothDatabase) = db.eventDao()
    @Provides fun provideCaptureDao(db: PhotoboothDatabase) = db.captureDao()
    @Provides fun provideShareDao(db: PhotoboothDatabase) = db.shareIntentDao()
    @Provides fun providePrintDao(db: PhotoboothDatabase) = db.printJobDao()
    @Provides fun provideConsentDao(db: PhotoboothDatabase) = db.consentDao()
    @Provides fun provideUploadQueueDao(db: PhotoboothDatabase) = db.uploadQueueDao()
    @Provides fun provideAnalyticsDao(db: PhotoboothDatabase) = db.analyticsDao()

    @Provides
    @Singleton
    fun provideSaveCaptureUseCase(repo: CaptureRepository, eventRepo: EventRepository) =
        SaveCaptureUseCase(repo, eventRepo)

    @Provides
    @Singleton
    fun provideEnqueueShareUseCase(repo: ShareRepository) = EnqueueShareUseCase(repo)
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds @Singleton abstract fun bindEventRepository(impl: EventRepositoryImpl): EventRepository
    @Binds @Singleton abstract fun bindCaptureRepository(impl: CaptureRepositoryImpl): CaptureRepository
    @Binds @Singleton abstract fun bindShareRepository(impl: ShareRepositoryImpl): ShareRepository
    @Binds @Singleton abstract fun bindPrintRepository(impl: PrintRepositoryImpl): PrintRepository
    @Binds @Singleton abstract fun bindConsentRepository(impl: ConsentRepositoryImpl): ConsentRepository
    @Binds @Singleton abstract fun bindCamera(impl: CameraXController): CameraController
}

@Module
@InstallIn(SingletonComponent::class)
object HardwareModule {
    @Provides @Singleton fun provideEscPosPrinter(impl: EscPosPrinter): EscPosPrinter = impl
}
