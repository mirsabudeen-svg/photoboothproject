package com.futad.photobooth.feature.sharing

import android.content.Context
import com.futad.photobooth.core.data.LocalMediaTokenizer
import dagger.hilt.android.qualifiers.ApplicationContext
import fi.iki.elonen.NanoHTTPD
import java.io.File
import java.io.FileInputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocalMediaServer @Inject constructor(
    @ApplicationContext private val context: Context,
) : NanoHTTPD(DEFAULT_PORT) {
    private val mediaMap = mutableMapOf<String, File>()
    private val signingKey by lazy { LocalMediaTokenizer.getOrCreateSigningKey(context) }

    fun registerMedia(captureId: String, file: File) {
        mediaMap[captureId] = file
    }

    fun startServer() {
        if (!isAlive) start(SOCKET_READ_TIMEOUT, false)
    }

    fun stopServer() {
        if (isAlive) stop()
    }

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri.removePrefix("/")
        if (uri.startsWith("media/")) {
            val pathAndQuery = uri.removePrefix("media/")
            val captureId = pathAndQuery.substringBefore("?")
            val token = session.parameters["token"]?.firstOrNull()

            if (token == null || !LocalMediaTokenizer.verify(captureId, token, signingKey)) {
                return newFixedLengthResponse(Response.Status.UNAUTHORIZED, MIME_PLAINTEXT, "Unauthorized")
            }

            val file = mediaMap[captureId]
            if (file != null && file.exists()) {
                val mime = when {
                    file.name.endsWith(".gif") -> "image/gif"
                    file.name.endsWith(".png") -> "image/png"
                    else -> "image/jpeg"
                }
                return newFixedLengthResponse(
                    Response.Status.OK,
                    mime,
                    FileInputStream(file),
                    file.length(),
                )
            }
            return newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "Not found")
        }
        return newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "Not found")
    }

    companion object {
        const val DEFAULT_PORT = 8080
    }
}
