/**
 * SCORM API Wrapper
 * Упрощенная обертка для SCORM API
 * В реальной LMS системе этот API предоставляется самой системой
 */

var API = null;
var findAPITries = 0;

function getAPI() {
    // Пытаемся найти SCORM API в различных местах
    if (window.API) {
        return window.API;
    }
    if (window.API_1484_11) {
        return window.API_1484_11;
    }
    if (window.parent && window.parent.API) {
        return window.parent.API;
    }
    if (window.parent && window.parent.API_1484_11) {
        return window.parent.API_1484_11;
    }
    if (window.top && window.top.API) {
        return window.top.API;
    }
    if (window.top && window.top.API_1484_11) {
        return window.top.API_1484_11;
    }
    
    // Если API не найден, создаем заглушку для тестирования
    if (findAPITries < 7) {
        findAPITries++;
        setTimeout(getAPI, 500);
        return null;
    }
    
    // Создаем локальное хранилище для тестирования без LMS
    console.warn("SCORM API не найден. Используется локальное хранилище для тестирования.");
    return createLocalStorageAPI();
}

function createLocalStorageAPI() {
    // Заглушка API для тестирования без реальной LMS
    return {
        LMSInitialize: function(param) {
            console.log("LMSInitialize called");
            return "true";
        },
        LMSFinish: function(param) {
            console.log("LMSFinish called");
            return "true";
        },
        LMSGetValue: function(element) {
            var value = localStorage.getItem("scorm_" + element);
            console.log("LMSGetValue", element, "=", value);
            return value || "";
        },
        LMSSetValue: function(element, value) {
            localStorage.setItem("scorm_" + element, value);
            console.log("LMSSetValue", element, "=", value);
            return "true";
        },
        LMSCommit: function(param) {
            console.log("LMSCommit called");
            return "true";
        },
        LMSGetLastError: function() {
            return "0";
        },
        LMSGetErrorString: function(errorCode) {
            return "No Error";
        },
        LMSGetDiagnostic: function(errorCode) {
            return "No Error";
        }
    };
}

