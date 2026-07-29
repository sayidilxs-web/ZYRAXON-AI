package com.zyraxon.automation

import android.util.Log
import com.google.gson.Gson
import fi.iki.elonen.NanoHTTPD

/**
 * Local HTTP Server for ZYRAXON Mobile Automation
 * 
 * Runs on port 19091, accessible at http://localhost:19091
 * 
 * Endpoints:
 *   GET  /health              → Server + service status
 *   GET  /ui-tree             → Complete UI tree JSON
 *   GET  /screen-text        → All visible text on screen
 *   GET  /all-elements        → All clickable/scrollable elements
 *   GET  /foreground-app      → Current foreground app package/activity
 *   GET  /device-info          → Device information
 *   GET  /installed-apps       → List of installed apps
 *   GET  /battery             → Battery level
 *   GET  /screen-on           → Is screen on?
 *   GET  /wifi-enabled        → Is WiFi enabled?
 *   GET  /bluetooth-enabled    → Is Bluetooth enabled?
 *   GET  /brightness          → Screen brightness level
 *   
 *   POST /click/text          → Click by text content {"text": "Button", "partial": true}
 *   POST /click/id            → Click by resource ID {"id": "com.example:id/button"}
 *   POST /click/description   → Click by content description {"description": "Menu"}
 *   POST /click/coordinate    → Click at coordinates {"x": 500, "y": 800}
 *   POST /double-click        → Double click at coordinates {"x": 500, "y": 800}
 *   POST /long-press          → Long press at coordinates {"x": 500, "y": 800}
 *   POST /swipe               → Swipe gesture {"x1": 100, "y1": 500, "x2": 800, "y2": 500, "duration": 300}
 *   POST /scroll              → Scroll {"direction": "forward|backward|down|up"}
 *   POST /type                → Type text {"text": "hello"}
 *   POST /clear-text          → Clear text field
 *   POST /press-enter         → Press Enter key
 *   POST /press-delete        → Press Delete key
 *   POST /check               → Check checkbox
 *   POST /uncheck             → Uncheck checkbox
 *   POST /toggle              → Toggle checkbox/switch
 *   POST /expand              → Expand dropdown
 *   POST /collapse            → Collapse dropdown
 *   POST /open-app            → Open app by package name {"package": "com.youtube"}
 *   POST /vibrate             → Vibrate {"pattern": [0, 100, 100, 100]}
 *   
 *   POST /go-back             → Press back button
 *   POST /go-home             → Press home button
 *   POST /go-recents         → Open recent apps
 *   POST /notification        → Open notification shade
 *   POST /quick-settings      → Open quick settings
 *   POST /screenshot          → Take screenshot
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
                .also { headers -> corsHeaders.forEach { (k, v) -> headers.addHeader(k, v) } }
        }

        val uri = session.uri
        val response = try {
            when (uri) {
                // ========== GET REQUESTS ==========
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
                
                "/battery" -> jsonResponse(mapOf(
                    "level" to service.getBatteryLevel(),
                    "percentage" to "${service.getBatteryLevel()}%"
                ))
                
                "/screen-on" -> jsonResponse(mapOf("on" to service.isScreenOn()))
                
                "/wifi-enabled" -> jsonResponse(mapOf("enabled" to service.isWifiEnabled()))
                
                "/bluetooth-enabled" -> jsonResponse(mapOf("enabled" to service.isBluetoothEnabled()))
                
                "/brightness" -> jsonResponse(mapOf(
                    "level" to service.getBrightness(),
                    "percentage" to "${service.getBrightness()}%"
                ))
                
                // ========== POST REQUESTS - CLICK ==========
                "/click/text" -> {
                    val body = readBody(session)
                    val text = body.get("text")?.asString ?: return jsonResponse(mapOf("error" to "No text"), 400)
                    val partial = body.get("partial")?.asBoolean ?: true
                    val success = service.clickByText(text, partial)
                    jsonResponse(mapOf("success" to success))
                }
                
                "/click/id" -> {
                    val body = readBody(session)
                    val id = body.get("id")?.asString ?: return jsonResponse(mapOf("error" to "No id"), 400)
                    val success = service.clickByResourceId(id)
                    jsonResponse(mapOf("success" to success))
                }
                
                "/click/description" -> {
                    val body = readBody(session)
                    val desc = body.get("description")?.asString ?: return jsonResponse(mapOf("error" to "No description"), 400)
                    val partial = body.get("partial")?.asBoolean ?: true
                    val success = service.clickByDescription(desc, partial)
                    jsonResponse(mapOf("success" to success))
                }
                
                "/click/coordinate" -> {
                    val body = readBody(session)
                    val x = body.get("x")?.asInt ?: return jsonResponse(mapOf("error" to "No x"), 400)
                    val y = body.get("y")?.asInt ?: return jsonResponse(mapOf("error" to "No y"), 400)
                    val success = service.clickAtCoordinate(x, y)
                    jsonResponse(mapOf("success" to success, "x" to x, "y" to y))
                }
                
                "/double-click" -> {
                    val body = readBody(session)
                    val x = body.get("x")?.asInt ?: return jsonResponse(mapOf("error" to "No x"), 400)
                    val y = body.get("y")?.asInt ?: return jsonResponse(mapOf("error" to "No y"), 400)
                    val success = service.doubleClickAtCoordinate(x, y)
                    jsonResponse(mapOf("success" to success, "x" to x, "y" to y))
                }
                
                "/long-press" -> {
                    val body = readBody(session)
                    val x = body.get("x")?.asInt ?: return jsonResponse(mapOf("error" to "No x"), 400)
                    val y = body.get("y")?.asInt ?: return jsonResponse(mapOf("error" to "No y"), 400)
                    val success = service.longClickAtCoordinate(x, y)
                    jsonResponse(mapOf("success" to success, "x" to x, "y" to y))
                }
                
                // ========== POST REQUESTS - GESTURE ==========
                "/swipe" -> {
                    val body = readBody(session)
                    val x1 = body.get("x1")?.asInt ?: return jsonResponse(mapOf("error" to "No x1"), 400)
                    val y1 = body.get("y1")?.asInt ?: return jsonResponse(mapOf("error" to "No y1"), 400)
                    val x2 = body.get("x2")?.asInt ?: return jsonResponse(mapOf("error" to "No x2"), 400)
                    val y2 = body.get("y2")?.asInt ?: return jsonResponse(mapOf("error" to "No y2"), 400)
                    val dur = body.get("duration")?.asLong ?: 300
                    val success = service.swipe(x1, y1, x2, y2, dur)
                    jsonResponse(mapOf("success" to success, "from" to "$x1,$y1", "to" to "$x2,$y2"))
                }
                
                "/scroll" -> {
                    val body = readBody(session)
                    val direction = body.get("direction")?.asString ?: "forward"
                    val success = when (direction) {
                        "backward" -> service.scroll(false)
                        "up" -> service.scrollUp()
                        "down" -> service.scrollDown()
                        else -> service.scroll(true)
                    }
                    jsonResponse(mapOf("success" to success, "direction" to direction))
                }
                
                // ========== POST REQUESTS - TEXT ==========
                "/type" -> {
                    val body = readBody(session)
                    val text = body.get("text")?.asString ?: return jsonResponse(mapOf("error" to "No text"), 400)
                    val success = service.typeText(text)
                    jsonResponse(mapOf("success" to success, "text" to text))
                }
                
                "/clear-text" -> {
                    val success = service.clearText()
                    jsonResponse(mapOf("success" to success))
                }
                
                "/press-enter" -> {
                    val success = service.pressEnter()
                    jsonResponse(mapOf("success" to success))
                }
                
                "/press-delete" -> {
                    val success = service.pressDelete()
                    jsonResponse(mapOf("success" to success))
                }
                
                // ========== POST REQUESTS - CHECKBOX ==========
                "/check" -> {
                    val success = service.check()
                    jsonResponse(mapOf("success" to success))
                }
                
                "/uncheck" -> {
                    val success = service.uncheck()
                    jsonResponse(mapOf("success" to success))
                }
                
                "/toggle" -> {
                    val success = service.toggle()
                    jsonResponse(mapOf("success" to success))
                }
                
                // ========== POST REQUESTS - EXPAND ==========
                "/expand" -> {
                    val success = service.expand()
                    jsonResponse(mapOf("success" to success))
                }
                
                "/collapse" -> {
                    val success = service.collapse()
                    jsonResponse(mapOf("success" to success))
                }
                
                // ========== POST REQUESTS - APPS ==========
                "/open-app" -> {
                    val body = readBody(session)
                    val pkg = body.get("package")?.asString ?: return jsonResponse(mapOf("error" to "No package"), 400)
                    val success = service.openApp(pkg)
                    jsonResponse(mapOf("success" to success, "package" to pkg))
                }
                
                "/app-installed" -> {
                    val body = readBody(session)
                    val pkg = body.get("package")?.asString ?: return jsonResponse(mapOf("error" to "No package"), 400)
                    val installed = service.isAppInstalled(pkg)
                    jsonResponse(mapOf("installed" to installed, "package" to pkg))
                }
                
                // ========== POST REQUESTS - DEVICE ==========
                "/vibrate" -> {
                    val body = readBody(session)
                    val patternArray = body.getAsJsonArray("pattern")
                    val pattern = if (patternArray != null) {
                        patternArray.map { it.asLong }.toLongArray()
                    } else {
                        longArrayOf(0, 100)
                    }
                    val success = service.vibrate(pattern)
                    jsonResponse(mapOf("success" to success))
                }
                
                // ========== GLOBAL ACTIONS ==========
                "/go-back" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
                    jsonResponse(mapOf("success" to true))
                }
                
                "/go-home" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME)
                    jsonResponse(mapOf("success" to true))
                }
                
                "/go-recents" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_RECENTS)
                    jsonResponse(mapOf("success" to true))
                }
                
                "/notification" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS)
                    jsonResponse(mapOf("success" to true))
                }
                
                "/quick-settings" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_QUICK_SETTINGS)
                    jsonResponse(mapOf("success" to true))
                }
                
                "/screenshot" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_TAKE_SCREENSHOT)
                    jsonResponse(mapOf("success" to true))
                }
                
                "/power-dialog" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_POWER_DIALOG)
                    jsonResponse(mapOf("success" to true))
                }
                
                "/lock-screen" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_LOCK_SCREEN)
                    jsonResponse(mapOf("success" to true))
                }
                
                "/search" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_SEARCH)
                    jsonResponse(mapOf("success" to true))
                }
                
                "/assist" -> {
                    service.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_ASSIST)
                    jsonResponse(mapOf("success" to true))
                }
                
                // ========== PINCH ZOOM ==========
                "/pinch-zoom" -> {
                    val success = service.pinchZoom()
                    jsonResponse(mapOf("success" to success))
                }
                
                // ========== NOT FOUND ==========
                else -> jsonResponse(mapOf("error" to "Not found: $uri", "available" to listOf(
                    "/health", "/ui-tree", "/screen-text", "/foreground-app", "/device-info",
                    "/installed-apps", "/battery", "/click/text", "/click/coordinate",
                    "/swipe", "/scroll", "/type", "/go-back", "/go-home", "/open-app"
                )), 404)
            }
        } catch (e: Exception) {
            Log.e("ZyraxonHttp", "Error handling $uri: " + e.message)
            jsonResponse(mapOf("error" to e.message), 500)
        }

        corsHeaders.forEach { (k, v) -> response.addHeader(k, v) }
        return response
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
