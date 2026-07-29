package com.zyraxon.automation

import android.accessibilityservice.AccessibilityService
import android.util.Log
import com.google.gson.Gson
import fi.iki.elonen.NanoHTTPD

/**
 * Local HTTP Server for communicating with the React Native app.
 *
 * Runs on port 19091, accessible at http://localhost:19091
 *
 * Endpoints:
 *   GET  /health           → Server status
 *   GET  /ui-tree          → Complete UI tree JSON
 *   GET  /screen-text      → All visible text on screen
 *   GET  /foreground-app   → Current foreground app package/activity
 *   POST /click/text       → Click by text content {"text": "YouTube"}
 *   POST /click/coordinate → Click at coordinates {"x": 500, "y": 800}
 *   POST /swipe            → Swipe gesture
 *   POST /type             → Type text {"text": "hello"}
 *   POST /scroll           → Scroll {"direction": "forward|backward"}
 *   POST /go-back          → Press back button
 *   POST /go-home          → Press home button
 */

class HttpServer(
    private val port: Int,
    private val service: ZyraxonAccessibilityService
) : NanoHTTPD("0.0.0.0", port) {

    private val gson = Gson()
    private var running = false

    fun startIfNotRunning() {
        if (!running) {
            try {
                start()
                running = true
                Log.i("ZyraxonHttp", "HTTP Server started on port " + port)
            } catch (e: Exception) {
                Log.e("ZyraxonHttp", "Failed to start: " + e.message)
            }
        }
    }

    override fun serve(session: IHTTPSession): Response {
        val corsHeaders = mapOf(
            "Access-Control-Allow-Origin" to "*",
            "Access-Control-Allow-Methods" to "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers" to "Content-Type"
        )

        if (session.method == Method.OPTIONS) {
            return newFixedLengthResponse(Response.Status.NO_CONTENT, "text/plain", "")
                .also { corsHeaders.forEach { (k, v) -> it.addHeader(k, v) } }
        }

        val uri = session.uri
        val response = try {
            when {
                uri == "/health" -> jsonResponse(mapOf(
                    "status" to "ok",
                    "service" to "zyraxon-automation",
                    "version" to "1.0.0",
                    "foreground" to service.getForegroundApp()
                ))
                uri == "/ui-tree" -> jsonResponse(parseJson(service.getUiDump()))
                uri == "/screen-text" -> jsonResponse(mapOf("text" to service.getAllText()))
                uri == "/foreground-app" -> jsonResponse(mapOf("app" to service.getForegroundApp()))
                uri == "/click/text" -> handleClickByText(session)
                uri == "/click/coordinate" -> handleClickCoordinate(session)
                uri == "/swipe" -> handleSwipe(session)
                uri == "/type" -> handleType(session)
                uri == "/scroll" -> handleScroll(session)
                uri == "/go-back" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK)
                    jsonResponse(mapOf("success" to true))
                }
                uri == "/go-home" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_HOME)
                    jsonResponse(mapOf("success" to true))
                }
                uri == "/go-recents" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_RECENTS)
                    jsonResponse(mapOf("success" to true))
                }
                uri == "/notification" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS)
                    jsonResponse(mapOf("success" to true))
                }
                uri == "/quick-settings" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_QUICK_SETTINGS)
                    jsonResponse(mapOf("success" to true))
                }
                else -> jsonResponse(mapOf("error" to "Not found"), 404)
            }
        } catch (e: Exception) {
            Log.e("ZyraxonHttp", "Error handling $uri: " + e.message)
            jsonResponse(mapOf("error" to e.message), 500)
        }

        corsHeaders.forEach { (k, v) -> response.addHeader(k, v) }
        return response
    }

    private fun handleClickByText(session: IHTTPSession): Response {
        val body = readBody(session)
        val text = body?.get("text")?.asString ?: return jsonResponse(mapOf("error" to "No text"), 400)
        val partial = body.get("partial")?.asBoolean ?: true
        val success = service.clickByText(text, partial)
        return jsonResponse(mapOf("success" to success))
    }

    private fun handleClickCoordinate(session: IHTTPSession): Response {
        val body = readBody(session)
        val x = body.get("x")?.asInt ?: return jsonResponse(mapOf("error" to "No x"), 400)
        val y = body.get("y")?.asInt ?: return jsonResponse(mapOf("error" to "No y"), 400)
        val success = service.clickAtCoordinate(x, y)
        return jsonResponse(mapOf("success" to success))
    }

    private fun handleSwipe(session: IHTTPSession): Response {
        val body = readBody(session)
        val x1 = body.get("x1")?.asInt ?: return jsonResponse(mapOf("error" to "No x1"), 400)
        val y1 = body.get("y1")?.asInt ?: return jsonResponse(mapOf("error" to "No y1"), 400)
        val x2 = body.get("x2")?.asInt ?: return jsonResponse(mapOf("error" to "No x2"), 400)
        val y2 = body.get("y2")?.asInt ?: return jsonResponse(mapOf("error" to "No y2"), 400)
        val dur = body.get("duration")?.asLong ?: 300
        val success = service.swipe(x1, y1, x2, y2, dur)
        return jsonResponse(mapOf("success" to success))
    }

    private fun handleType(session: IHTTPSession): Response {
        val body = readBody(session)
        val text = body.get("text")?.asString ?: return jsonResponse(mapOf("error" to "No text"), 400)
        val success = service.typeText(text)
        return jsonResponse(mapOf("success" to success))
    }

    private fun handleScroll(session: IHTTPSession): Response {
        val body = readBody(session)
        val forward = body.get("direction")?.asString != "backward"
        val success = service.scroll(forward)
        return jsonResponse(mapOf("success" to success))
    }

    private fun readBody(session: IHTTPSession): com.google.gson.JsonObject {
        val files = HashMap<String, String>()
        session.parseBody(files)
        val body = files["postData"] ?: "{}"
        return try {
            gson.fromJson(body, com.google.gson.JsonObject::class.java)
        } catch (e: Exception) {
            com.google.gson.JsonObject()
        }
    }

    private fun jsonResponse(data: Any, status: Int = 200): Response {
        val json = gson.toJson(data)
        return newFixedLengthResponse(Response.Status.lookup(status), "application/json", json)
    }

    private fun parseJson(json: String): Any {
        return try {
            gson.fromJson(json, Any::class.java)
        } catch (e: Exception) {
            mapOf("error" to "Parse error")
        }
    }
}
