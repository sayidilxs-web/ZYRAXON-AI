package com.zyraxon.automation

import android.accessibilityservice.AccessibilityService
import android.util.Log
import com.google.gson.Gson
import fi.iki.elonen.NanoHTTPD

/**
 * Local HTTP Server for ZYRAXON Mobile Automation
 * 
 * Runs on port 19091, accessible at http://localhost:19091
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
            val resp = newFixedLengthResponse(Response.Status.NO_CONTENT, "text/plain", "")
            corsHeaders.forEach { (k, v) -> resp.addHeader(k, v) }
            return resp
        }

        val uri = session.uri
        val response = try {
            when (uri) {
                "/health" -> jsonResponse(mapOf(
                    "status" to "ok",
                    "service" to "zyraxon-automation",
                    "version" to "2.0.0",
                    "foreground" to service.getForegroundApp(),
                    "screenOn" to service.isScreenOn()
                ))
                
                "/ui-tree" -> jsonResponse(parseJson(service.getUiDump()))
                "/screen-text" -> jsonResponse(mapOf("text" to service.getAllText()))
                "/all-elements" -> jsonResponse(parseJson(service.getAllElements()))
                "/foreground-app" -> jsonResponse(mapOf(
                    "app" to service.getForegroundApp(),
                    "package" to service.getForegroundApp().split("/").firstOrNull(),
                    "activity" to service.getForegroundApp().split("/").lastOrNull()
                ))
                "/device-info" -> jsonResponse(service.getDeviceInfo())
                "/installed-apps" -> jsonResponse(parseJson(service.getInstalledApps()))
                "/battery" -> jsonResponse(mapOf("level" to service.getBatteryLevel()))
                "/screen-on" -> jsonResponse(mapOf("on" to service.isScreenOn()))
                "/wifi-enabled" -> jsonResponse(mapOf("enabled" to service.isWifiEnabled()))
                "/bluetooth-enabled" -> jsonResponse(mapOf("enabled" to service.isBluetoothEnabled()))
                "/brightness" -> jsonResponse(mapOf("level" to service.getBrightness()))
                
                "/click/text" -> handleClickByText(session)
                "/click/id" -> handleClickById(session)
                "/click/description" -> handleClickByDescription(session)
                "/click/coordinate" -> handleClickCoordinate(session)
                "/double-click" -> handleDoubleClick(session)
                "/long-press" -> handleLongPress(session)
                "/swipe" -> handleSwipe(session)
                "/scroll" -> handleScroll(session)
                "/type" -> handleType(session)
                
                "/clear-text" -> { jsonResponse(mapOf("success" to service.clearText())) }
                "/press-enter" -> { jsonResponse(mapOf("success" to service.pressEnter())) }
                "/check" -> { jsonResponse(mapOf("success" to service.check())) }
                "/uncheck" -> { jsonResponse(mapOf("success" to service.uncheck())) }
                "/toggle" -> { jsonResponse(mapOf("success" to service.toggle())) }
                "/expand" -> { jsonResponse(mapOf("success" to service.expand())) }
                "/collapse" -> { jsonResponse(mapOf("success" to service.collapse())) }
                "/open-app" -> handleOpenApp(session)
                "/app-installed" -> handleAppInstalled(session)
                "/vibrate" -> handleVibrate(session)
                
                "/go-back" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK)
                    jsonResponse(mapOf("success" to true))
                }
                "/go-home" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_HOME)
                    jsonResponse(mapOf("success" to true))
                }
                "/go-recents" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_RECENTS)
                    jsonResponse(mapOf("success" to true))
                }
                "/notification" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS)
                    jsonResponse(mapOf("success" to true))
                }
                "/quick-settings" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_QUICK_SETTINGS)
                    jsonResponse(mapOf("success" to true))
                }
                "/screenshot" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_TAKE_SCREENSHOT)
                    jsonResponse(mapOf("success" to true))
                }
                "/power-dialog" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_POWER_DIALOG)
                    jsonResponse(mapOf("success" to true))
                }
                "/lock-screen" -> {
                    service.performGlobalAction(AccessibilityService.GLOBAL_ACTION_LOCK_SCREEN)
                    jsonResponse(mapOf("success" to true))
                }
                "/pinch-zoom" -> { jsonResponse(mapOf("success" to service.pinchZoom())) }
                
                else -> jsonResponse(mapOf("error" to "Not found: $uri"), 404)
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
        val text = body.get("text")?.asString ?: return jsonResponse(mapOf("error" to "No text"), 400)
        val partial = body.get("partial")?.asBoolean ?: true
        return jsonResponse(mapOf("success" to service.clickByText(text, partial)))
    }
    
    private fun handleClickById(session: IHTTPSession): Response {
        val body = readBody(session)
        val id = body.get("id")?.asString ?: return jsonResponse(mapOf("error" to "No id"), 400)
        return jsonResponse(mapOf("success" to service.clickByResourceId(id)))
    }
    
    private fun handleClickByDescription(session: IHTTPSession): Response {
        val body = readBody(session)
        val desc = body.get("description")?.asString ?: return jsonResponse(mapOf("error" to "No description"), 400)
        val partial = body.get("partial")?.asBoolean ?: true
        return jsonResponse(mapOf("success" to service.clickByDescription(desc, partial)))
    }

    private fun handleClickCoordinate(session: IHTTPSession): Response {
        val body = readBody(session)
        val x = body.get("x")?.asInt ?: return jsonResponse(mapOf("error" to "No x"), 400)
        val y = body.get("y")?.asInt ?: return jsonResponse(mapOf("error" to "No y"), 400)
        return jsonResponse(mapOf("success" to service.clickAtCoordinate(x, y)))
    }
    
    private fun handleDoubleClick(session: IHTTPSession): Response {
        val body = readBody(session)
        val x = body.get("x")?.asInt ?: return jsonResponse(mapOf("error" to "No x"), 400)
        val y = body.get("y")?.asInt ?: return jsonResponse(mapOf("error" to "No y"), 400)
        return jsonResponse(mapOf("success" to service.doubleClickAtCoordinate(x, y)))
    }
    
    private fun handleLongPress(session: IHTTPSession): Response {
        val body = readBody(session)
        val x = body.get("x")?.asInt ?: return jsonResponse(mapOf("error" to "No x"), 400)
        val y = body.get("y")?.asInt ?: return jsonResponse(mapOf("error" to "No y"), 400)
        return jsonResponse(mapOf("success" to service.longClickAtCoordinate(x, y)))
    }

    private fun handleSwipe(session: IHTTPSession): Response {
        val body = readBody(session)
        val x1 = body.get("x1")?.asInt ?: return jsonResponse(mapOf("error" to "No x1"), 400)
        val y1 = body.get("y1")?.asInt ?: return jsonResponse(mapOf("error" to "No y1"), 400)
        val x2 = body.get("x2")?.asInt ?: return jsonResponse(mapOf("error" to "No x2"), 400)
        val y2 = body.get("y2")?.asInt ?: return jsonResponse(mapOf("error" to "No y2"), 400)
        val duration = body.get("duration")?.asLong ?: 300L
        return jsonResponse(mapOf("success" to service.swipe(x1, y1, x2, y2, duration)))
    }

    private fun handleType(session: IHTTPSession): Response {
        val body = readBody(session)
        val text = body.get("text")?.asString ?: return jsonResponse(mapOf("error" to "No text"), 400)
        return jsonResponse(mapOf("success" to service.typeText(text)))
    }

    private fun handleScroll(session: IHTTPSession): Response {
        val body = readBody(session)
        val direction = body.get("direction")?.asString ?: "forward"
        val success = when (direction) {
            "backward", "up", "upward" -> service.scroll(false)
            else -> service.scroll(true)
        }
        return jsonResponse(mapOf("success" to success))
    }
    
    private fun handleOpenApp(session: IHTTPSession): Response {
        val body = readBody(session)
        val pkg = body.get("package")?.asString ?: return jsonResponse(mapOf("error" to "No package"), 400)
        return jsonResponse(mapOf("success" to service.openApp(pkg), "package" to pkg))
    }
    
    private fun handleAppInstalled(session: IHTTPSession): Response {
        val body = readBody(session)
        val pkg = body.get("package")?.asString ?: return jsonResponse(mapOf("error" to "No package"), 400)
        return jsonResponse(mapOf("installed" to service.isAppInstalled(pkg), "package" to pkg))
    }
    
    private fun handleVibrate(session: IHTTPSession): Response {
        val body = readBody(session)
        val patternArray = body.getAsJsonArray("pattern")
        val pattern = if (patternArray != null) {
            patternArray.map { it.asLong }.toLongArray()
        } else {
            longArrayOf(0, 100)
        }
        return jsonResponse(mapOf("success" to service.vibrate(pattern)))
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
