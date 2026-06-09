package com.futad.photobooth.feature.capture.util

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class GifHeaderTest {
    @Test
    fun `isGifFile detects GIF89a header`() {
        val file = File.createTempFile("test", ".gif")
        file.writeBytes("GIF89a".toByteArray(Charsets.US_ASCII))
        assertTrue(isGifFile(file))
        file.delete()
    }
}
