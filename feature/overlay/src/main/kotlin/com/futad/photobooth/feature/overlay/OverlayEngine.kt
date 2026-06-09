package com.futad.photobooth.feature.overlay

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import com.futad.photobooth.core.domain.model.WeddingEventConfig
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton

data class PhotoSlot(val x: Int, val y: Int, val width: Int, val height: Int)

data class PrintTemplate(
    val id: String,
    val canvasWidth: Int,
    val canvasHeight: Int,
    val slots: List<PhotoSlot>,
    val printSize: String,
)

@Singleton
class TemplateEngine @Inject constructor() {
    val templates = mapOf(
        "4x6_postcard" to PrintTemplate(
            id = "4x6_postcard",
            canvasWidth = 1800,
            canvasHeight = 1200,
            slots = listOf(PhotoSlot(100, 100, 1600, 900)),
            printSize = "4x6",
        ),
        "2x6_strip" to PrintTemplate(
            id = "2x6_strip",
            canvasWidth = 600,
            canvasHeight = 1800,
            slots = listOf(
                PhotoSlot(50, 50, 500, 500),
                PhotoSlot(50, 580, 500, 500),
                PhotoSlot(50, 1110, 500, 500),
            ),
            printSize = "2x6",
        ),
    )

    fun templateFor(config: WeddingEventConfig): PrintTemplate =
        templates[config.templateId] ?: templates.getValue("4x6_postcard")
}

@Singleton
class LayoutCompositor @Inject constructor(
    private val templateEngine: TemplateEngine,
) {
    fun compose(
        photoPaths: List<String>,
        config: WeddingEventConfig,
        outputFile: File,
    ): File {
        val template = templateEngine.templateFor(config)
        val bitmap = Bitmap.createBitmap(template.canvasWidth, template.canvasHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        photoPaths.take(template.slots.size).forEachIndexed { index, path ->
            val slot = template.slots[index]
            val photo = BitmapFactory.decodeFile(path) ?: return@forEachIndexed
            val dest = Rect(slot.x, slot.y, slot.x + slot.width, slot.y + slot.height)
            canvas.drawBitmap(photo, null, dest, Paint(Paint.ANTI_ALIAS_FLAG))
            photo.recycle()
        }
        drawCaption(canvas, config, template.canvasWidth, template.canvasHeight)
        FileOutputStream(outputFile).use { bitmap.compress(Bitmap.CompressFormat.JPEG, 92, it) }
        bitmap.recycle()
        return outputFile
    }

    private fun drawCaption(canvas: Canvas, config: WeddingEventConfig, width: Int, height: Int) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor(config.primaryColor)
            textSize = 48f
            textAlign = Paint.Align.CENTER
        }
        val caption = listOfNotNull(
            config.brideName.takeIf { it.isNotBlank() },
            config.groomName.takeIf { it.isNotBlank() },
        ).joinToString(" & ")
        if (caption.isNotBlank()) {
            canvas.drawText(caption, width / 2f, height - 40f, paint)
        }
        config.hashtag?.let {
            paint.textSize = 32f
            canvas.drawText(it, width / 2f, height - 90f, paint)
        }
    }
}
