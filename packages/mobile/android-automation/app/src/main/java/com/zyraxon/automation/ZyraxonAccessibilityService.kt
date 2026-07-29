package com.zyraxon.automation

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.Rect
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.google.gson.Gson
import java.util.concurrent.ConcurrentLinkedQueue

/**
 * ZYRAXON AccessibilityService
 *
 * REAL Android automation via Accessibility API.
 * Capabilities:
 *   - Read complete UI tree with text, bounds, roles
 *   - REAL click on any element (not simulated - real tap)
 *   - REAL scroll, swipe, long-press via GestureDescription
 *   - Type text via clipboard + paste
 *   - Detect foreground app changes
 *
 * Communicates with React Native app via local HTTP server on port 19091.
 */

class ZyraxonAccessibilityService : AccessibilityService() {

    companion object {
        var instance: ZyraxonAccessibilityService? = null
        var httpServer: HttpServer? = null
        private val gson = Gson()
    }

    private val handler = Handler(Looper.getMainLooper())
    private var currentPackage = ""
    private var currentActivity = ""
    private var lastUiDump = "{}"
    private val eventQueue = ConcurrentLinkedQueue<AccessibilityEvent>()

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        httpServer = HttpServer(19091, this)
        httpServer?.start()
        android.util.Log.i("ZyraxonAS", "AccessibilityService connected. HTTP server on :19091")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                currentPackage = event.packageName?.toString() ?: ""
                if (event.className != null) {
                    currentActivity = event.className.toString()
                }
                // Dump UI tree when window changes
                handler.postDelayed({
                    dumpUiTree()
                }, 500)
            }
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                // Throttled UI tree update
                handler.removeCallbacksAndMessages(null)
                handler.postDelayed({
                    dumpUiTree()
                }, 800)
            }
        }
    }

    override fun onInterrupt() {
        android.util.Log.w("ZyraxonAS", "AccessibilityService interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        httpServer?.stop()
    }

    /**
     * Dump the complete UI tree as JSON
     */
    private fun dumpUiTree() {
        val root = rootInActiveWindow ?: return
        try {
            val tree = nodeToMap(root)
            val screenInfo = mapOf(
                "packageName" to currentPackage,
                "activityName" to currentActivity,
                "displayWidth" to resources.displayMetrics.widthPixels,
                "displayHeight" to resources.displayMetrics.heightPixels,
                "timestamp" to System.currentTimeMillis(),
                "nodes" to tree["children"]
            )
            lastUiDump = gson.toJson(screenInfo)
        } catch (e: Exception) {
            android.util.Log.w("ZyraxonAS", "UI dump error: ${e.message}")
        } finally {
            root.recycle()
        }
    }

    fun getUiDump(): String = lastUiDump

    /**
     * Convert AccessibilityNodeInfo to JSON-safe map
     */
    private fun nodeToMap(node: AccessibilityNodeInfo): Map<String, Any?> {
        val bounds = Rect()
        node.getBoundsInScreen(bounds)

        val children = mutableListOf<Map<String, Any?>>()
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { child ->
                children.add(nodeToMap(child))
                child.recycle()
            }
        }

        return mapOf(
            "text" to (node.text?.toString()),
            "contentDescription" to (node.contentDescription?.toString()),
            "className" to (node.className?.toString()),
            "packageName" to (node.packageName?.toString()),
            "viewIdResourceName" to (node.viewIdResourceName),
            "bounds" to mapOf(
                "x" to bounds.left,
                "y" to bounds.top,
                "width" to (bounds.right - bounds.left),
                "height" to (bounds.bottom - bounds.top)
            ),
            "center" to mapOf(
                "x" to (bounds.left + bounds.right) / 2,
                "y" to (bounds.top + bounds.bottom) / 2
            ),
            "clickable" to node.isClickable,
            "longClickable" to node.isLongClickable,
            "scrollable" to node.isScrollable,
            "checkable" to node.isCheckable,
            "checked" to node.isChecked,
            "focused" to node.isFocused,
            "enabled" to node.isEnabled,
            "password" to node.isPassword,
            "selected" to node.isSelected,
            "depth" to 0,
            "children" to children
        )
    }

    /**
     * REAL click on element found by text content
     * Returns true if element was found and clicked
     */
    fun clickByText(text: String, partialMatch: Boolean = true): Boolean {
        val root = rootInActiveWindow ?: return false
        try {
            val node = findNodeByText(root, text, partialMatch)
            if (node != null && node.isClickable) {
                node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                return true
            }
            // If node exists but isn't clickable, try clicking parent
            if (node != null) {
                var parent = node.parent
                while (parent != null) {
                    if (parent.isClickable) {
                        parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                        parent.recycle()
                        return true
                    }
                    val oldParent = parent
                    parent = parent.parent
                    oldParent.recycle()
                }
            }
            return false
        } catch (e: Exception) {
            return false
        } finally {
            root.recycle()
        }
    }

    /**
     * REAL click at exact screen coordinates via GestureDescription
     * This is a REAL touch event, not simulated
     */
    fun clickAtCoordinate(x: Int, y: Int): Boolean {
        val path = Path()
        path.moveTo(x.toFloat(), y.toFloat())
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 100))
            .build()
        return dispatchGesture(gesture, null, null)
    }

    /**
     * REAL swipe from (x1,y1) to (x2,y2)
     */
    fun swipe(x1: Int, y1: Int, x2: Int, y2: Int, durationMs: Long = 300): Boolean {
        val path = Path()
        path.moveTo(x1.toFloat(), y1.toFloat())
        path.lineTo(x2.toFloat(), y2.toFloat())
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, durationMs))
            .build()
        return dispatchGesture(gesture, null, null)
    }

    /**
     * REAL scroll forward/backward
     */
    fun scroll(forward: Boolean = true): Boolean {
        val root = rootInActiveWindow ?: return false
        try {
            val scrollable = findScrollableNode(root)
            if (scrollable != null) {
                val action = if (forward)
                    AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
                else
                    AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
                scrollable.performAction(action)
                return true
            }
            return false
        } finally {
            root.recycle()
        }
    }

    /**
     * Type text by setting clipboard and pasting
     */
    fun typeText(text: String): Boolean {
        try {
            val clipboard = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("zyraxon_text", text))

            val root = rootInActiveWindow ?: return false
            try {
                val focused = findFocusedNode(root)
                if (focused != null) {
                    focused.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
                    focused.performAction(android.R.id.paste)
                    return true
                }
                return false
            } finally {
                root.recycle()
            }
        } catch (e: Exception) {
            return false
        }
    }

    /**
     * Get all text visible on screen
     */
    fun getAllText(): String {
        val root = rootInActiveWindow ?: return ""
        try {
            val texts = mutableListOf<String>()
            collectTexts(root, texts)
            return texts.joinToString("\n")
        } finally {
            root.recycle()
        }
    }

    fun getForegroundApp(): String = "$currentPackage/$currentActivity"

    private fun findNodeByText(node: AccessibilityNodeInfo, text: String, partial: Boolean): AccessibilityNodeInfo? {
        val nodeText = node.text?.toString() ?: ""
        val nodeDesc = node.contentDescription?.toString() ?: ""
        val combined = "$nodeText $nodeDesc"

        if (partial) {
            if (combined.contains(text, ignoreCase = true)) return node
        } else {
            if (combined.equals(text, ignoreCase = true)) return node
        }

        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { child ->
                val found = findNodeByText(child, text, partial)
                if (found != null) {
                    child.recycle()
                    return found
                }
                child.recycle()
            }
        }
        return null
    }

    private fun findScrollableNode(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        if (node.isScrollable) return node
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { child ->
                val found = findScrollableNode(child)
                if (found != null) {
                    child.recycle()
                    return found
                }
                child.recycle()
            }
        }
        return null
    }

    private fun findFocusedNode(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        if (node.isFocused) return node
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { child ->
                val found = findFocusedNode(child)
                if (found != null) {
                    child.recycle()
                    return found
                }
                child.recycle()
            }
        }
        return null
    }

    private fun collectTexts(node: AccessibilityNodeInfo, texts: MutableList<String>) {
        node.text?.toString()?.let { if (it.isNotBlank()) texts.add(it) }
        node.contentDescription?.toString()?.let { if (it.isNotBlank()) texts.add(it) }
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { child ->
                collectTexts(child, texts)
                child.recycle()
            }
        }
    }
}
