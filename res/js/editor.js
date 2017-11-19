require.config({ paths: { 'vs': 'monaco-editor/min/vs' } });

var MINUTE = 60000;
var EDITOR_TEXT_COOKIE_EXPIRE_MS = MINUTE * 60 * 3;
var LANGUAGES;
var THEMES;
var normEditor;
var diffEditor;
var MODE_EDITOR = "Editor Mode";
var MODE_DIFF = "Diff Mode";
var mode = MODE_EDITOR;
var storeInput = true;

// setup values
require(['vs/editor/editor.main'], function () {
    LANGUAGES = monaco.languages.getLanguages().map(x => x.id).sort();
    let selector = document.getElementById("languageSelector");
    let saved = getCookie("language") === undefined ? LANGUAGES[0] : b64Dec(getCookie("language"));
    for (let idx in LANGUAGES) {
        var option = document.createElement("option");
        option.text = LANGUAGES[idx];

        if (saved === option.text)
            option.selected = true;

        selector.add(option);
    }

    THEMES = ["vs", "vs-dark", "hc-black"];
    selector = document.getElementById("themeSelector");
    saved = getCookie("theme") === undefined ? THEMES[0] : b64Dec(getCookie("theme"));
    for (let idx in THEMES) {
        var option = document.createElement("option");
        option.text = THEMES[idx];

        if (saved === option.text)
            option.selected = true;

        selector.add(option);
    }

});

function b64Enc(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
}

function b64Dec(str) {
    return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

function setCookie(k, v, ttl) {
    if (ttl === undefined)
        ttl = EDITOR_TEXT_COOKIE_EXPIRE_MS;

    let expires = "";
    if (ttl >= 0) {
        let now = new Date();
        let time = now.getTime();
        time += ttl;
        now.setTime(time);
        expires = "expires=" + now.toUTCString() + ";";
        console.log(expires);
    }

    let _cookie = k + "=" + v + "; " + expires;
    document.cookie = _cookie;
}

function getCookie(k) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + k + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

function setStorage(k, v) {
    if (typeof (Storage) !== "undefined")
        localStorage.setItem(k, v);
}

function getStorage(k) {
    if (typeof (Storage) !== "undefined")
        return localStorage.getItem(k);
    return undefined;
}

function createEditor(value) {
    if (value === undefined || value === null)
        value = "";

    require(['vs/editor/editor.main'], function () {
        normEditor = monaco.editor.create(document.getElementById('norm_editor'), {
            value: value,
            theme: getCookie("theme") === undefined ? THEMES[0] : b64Dec(getCookie("theme")),
            language: getCookie("language") === undefined ? LANGUAGES[0] : b64Dec(getCookie("language")),
            scrollBeyondLastLine: false,
            automaticLayout: true
        });

        normEditor.onKeyUp(function (e) {
            let text = normEditor.getValue();
            if (!storeInput)
                text = "";
            setStorage("text", b64Enc(text));
        });

        normEditor.onDidChangeModelContent(function (e) {
            console.log(e);
        });
    });
}

function createDiffEditor() {
    require(['vs/editor/editor.main'], function () {
        diffEditor = monaco.editor.createDiffEditor(document.getElementById("diff_editor"), {
            originalEditable: true,
            scrollBeyondLastLine: false,
            automaticLayout: true
        });

        var originalModel = monaco.editor.createModel("", "text/plain");
        var modifiedModel = monaco.editor.createModel("", "text/plain");

        diffEditor.setModel({
            original: originalModel,
            modified: modifiedModel
        });
    });
}

function swapMode(ele) {
    let normalEditor = document.getElementById("norm_editor");
    let diffEditor = document.getElementById("diff_editor");

    if (mode === MODE_EDITOR) { // current mode is normal editor
        normalEditor.style.display = "none";
        diffEditor.style.display = "";
        mode = MODE_DIFF;
        ele.innerText = "Editor Mode";
    } else if (mode === MODE_DIFF) {
        normalEditor.style.display = "";
        diffEditor.style.display = "none";
        mode = MODE_EDITOR;
        ele.innerText = "Diff Mode";
    }
}

function selectorUpdate(selector) {
    let type = selector.getAttribute("optionType");
    let val = selector.options[selector.selectedIndex].value;

    optionUpdate(type, val);
}

function optionUpdate(type, val) {
    console.log(type + ": " + val);

    if (type === "language") {
        monaco.editor.setModelLanguage(normEditor.getModel(), val);
        setCookie(type, b64Enc(val), MINUTE * 60 * 24 * 30);
    } else if (type === "theme") {
        monaco.editor.setTheme(val);
        setCookie(type, b64Enc(val), MINUTE * 60 * 24 * 30);
    } else {
        let option = {};

        option[type] = val;
        updateOptions(option);
    }
}

function updateOptions(options) {
    console.log(options);
    normEditor.updateOptions(options);
}

function setStoreInput(toStore) {
    storeInput = toStore;
    document.getElementById("storeInput").checked = storeInput;

    setCookie("storeInput", storeInput);

    let text = normEditor.getValue();
    if (!storeInput)
        text = "";
    setStorage("text", b64Enc(text));
}

window.onload = function () {
    if (document.cookie !== undefined
        && document.cookie !== null
        && getCookie("storeInput") !== undefined
        && getCookie("storeInput") !== null) {
        setStoreInput("true" == getCookie("storeInput"));
    }
}

var defaultValue = "";
if (document.cookie !== undefined
    && document.cookie !== null
    && getStorage("text") !== undefined
    && getStorage("text") !== null
    && storeInput) {
    defaultValue = b64Dec(getStorage("text"));
}

createEditor(defaultValue);
createDiffEditor();
