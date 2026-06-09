package com.futad.photobooth.feature.capture.util

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

object GifEncoder {
    fun encode(frameFiles: List<File>, output: File, delayMs: Int = 120): File {
        require(frameFiles.isNotEmpty()) { "At least one frame required" }
        val bitmaps = frameFiles.map { BitmapFactory.decodeFile(it.absolutePath) }
        try {
            val encoder = AnimatedGifEncoder()
            val stream = ByteArrayOutputStream()
            encoder.start(stream)
            encoder.setRepeat(0)
            encoder.setDelay(delayMs)
            bitmaps.forEach { encoder.addFrame(it) }
            encoder.finish()
            FileOutputStream(output).use { it.write(stream.toByteArray()) }
            return output
        } finally {
            bitmaps.forEach { it.recycle() }
        }
    }
}

object BoomerangEncoder {
    fun encode(frameFiles: List<File>, output: File): File {
        val sequence = frameFiles + frameFiles.dropLast(1).reversed()
        return GifEncoder.encode(sequence, output, delayMs = 80)
    }
}

/**
 * Minimal GIF89a encoder (LZW) for photobooth burst frames.
 */
class AnimatedGifEncoder {
    private var width = 0
    private var height = 0
    private var repeat = -1
    private var delay = 0
    private var started = false
    private var out: ByteArrayOutputStream? = null
    private var frames = mutableListOf<Bitmap>()

    fun setDelay(ms: Int) {
        delay = ms / 10
    }

    fun setRepeat(iter: Int) {
        repeat = iter
    }

    fun addFrame(bitmap: Bitmap) {
        if (!started) {
            width = bitmap.width
            height = bitmap.height
            started = true
        }
        frames.add(bitmap.copy(bitmap.config ?: Bitmap.Config.ARGB_8888, false))
    }

    fun start(stream: ByteArrayOutputStream) {
        out = stream
        writeString("GIF89a")
    }

    fun finish() {
        val stream = out ?: throw IllegalStateException("GIF not started")
        if (frames.isEmpty()) return
        writeGraphicControlExtension()
        writeNetscapeExt()
        frames.forEachIndexed { index, frame ->
            writeImageDescriptor(index)
            writeLzwImageData(frame)
        }
        stream.write(0x3B)
        frames.forEach { it.recycle() }
        frames.clear()
    }

    private fun writeString(value: String) {
        value.forEach { out?.write(it.code) }
    }

    private fun writeGraphicControlExtension() {
        out?.write(0x21)
        out?.write(0xFF)
        out?.write(11)
        writeString("NETSCAPE2.0")
        out?.write(3)
        out?.write(1)
        writeShort(repeat)
        out?.write(0)
    }

    private fun writeNetscapeExt() {
        out?.write(0x21)
        out?.write(0xF9)
        out?.write(4)
        out?.write(0)
        writeShort(delay)
        out?.write(0)
        out?.write(0)
    }

    private fun writeImageDescriptor(index: Int) {
        out?.write(0x2C)
        writeShort(0)
        writeShort(0)
        writeShort(width)
        writeShort(height)
        out?.write(0)
    }

    private fun writeShort(value: Int) {
        out?.write(value and 0xFF)
        out?.write(value shr 8 and 0xFF)
    }

    private fun writeLzwImageData(bitmap: Bitmap) {
        val pixels = IntArray(width * height)
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height)
        val indexed = pixels.map { rgb ->
            val r = (rgb shr 16) and 0xFF
            val g = (rgb shr 8) and 0xFF
            val b = rgb and 0xFF
            ((r + g + b) / 3).toByte()
        }.toByteArray()
        val lzw = LzwEncoder(width, height, indexed, 8)
        out?.write(8)
        lzw.encode(out!!)
    }
}

private class LzwEncoder(
    private val width: Int,
    private val height: Int,
    private val pixels: ByteArray,
    private val colorDepth: Int,
) {
    fun encode(out: ByteArrayOutputStream) {
        val initialCodeSize = colorDepth
        var codeSize = initialCodeSize + 1
        var clearCode = 1 shl initialCodeSize
        var endCode = clearCode + 1
        var nextCode = endCode + 1
        var dictSize = 1 shl codeSize
        val dictionary = HashMap<String, Int>()
        var current = StringBuilder()
        val bitBuffer = BitBuffer(out)
        bitBuffer.writeBits(clearCode, codeSize)
        for (pixel in pixels) {
            val key = pixel.toString()
            val combined = current.toString() + key
            if (dictionary.containsKey(combined) || combined.length == 1) {
                current.append(key)
                if (combined.length == 1) dictionary[combined] = pixel.toInt() and 0xFF
            } else {
                val code = dictionary[current.toString()] ?: (current[0].code and 0xFF)
                bitBuffer.writeBits(code, codeSize)
                dictionary[combined] = nextCode++
                if (nextCode == dictSize && codeSize < 12) {
                    codeSize++
                    dictSize = 1 shl codeSize
                }
                current = StringBuilder(key)
            }
        }
        if (current.isNotEmpty()) {
            bitBuffer.writeBits(dictionary[current.toString()] ?: (current[0].code and 0xFF), codeSize)
        }
        bitBuffer.writeBits(endCode, codeSize)
        bitBuffer.flush()
        out.write(0)
    }
}

private class BitBuffer(private val out: ByteArrayOutputStream) {
    private var curByte = 0
    private var numBits = 0

    fun writeBits(code: Int, size: Int) {
        var value = code
        var bits = size
        while (bits > 0) {
            if (numBits == 8) {
                flushByte()
            }
            curByte = curByte or ((value and 1) shl numBits)
            value = value shr 1
            bits--
            numBits++
        }
    }

    fun flush() {
        if (numBits > 0) flushByte()
    }

    private fun flushByte() {
        out.write(curByte)
        curByte = 0
        numBits = 0
    }
}

fun isGifFile(file: File): Boolean {
    return file.length() >= 6 && file.inputStream().use { stream ->
        val header = ByteArray(6)
        stream.read(header) == 6 && String(header) == "GIF89a"
    }
}
