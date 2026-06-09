package com.futad.photobooth.feature.capture.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayOutputStream

class GifEncoderOutputTest {
    @Test
    fun animatedEncoderWritesGif89aHeader() {
        val encoder = AnimatedGifEncoder()
        val stream = ByteArrayOutputStream()
        encoder.start(stream)
        val header = stream.toString(Charsets.US_ASCII)
        assertEquals("GIF89a", header)
    }

    @Test
    fun boomerangSequenceDoublesMinusOverlap() {
        val frames = listOf("a", "b", "c", "d", "e")
        val sequence = frames + frames.dropLast(1).reversed()
        assertEquals(9, sequence.size)
        assertEquals("a", sequence.first())
        assertEquals("a", sequence.last())
    }

    @Test
    fun isGifFileDetectsGif89aHeader() {
        val file = java.io.File.createTempFile("test", ".gif")
        file.writeBytes("GIF89a".toByteArray(Charsets.US_ASCII))
        assertTrue(isGifFile(file))
        file.delete()
    }

    @Test
    fun isGifFileDetectsGif87aHeader() {
        val file = java.io.File.createTempFile("test", ".gif")
        file.writeBytes("GIF87a".toByteArray(Charsets.US_ASCII))
        assertTrue(isGifFile(file))
        file.delete()
    }
}
