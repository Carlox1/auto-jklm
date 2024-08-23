// ==UserScript==
// @name         auto-jklm
// @namespace    http://tampermonkey.net/
// @version      1.3.5
// @updateURL    https://raw.githubusercontent.com/Carlox1/auto-jklm/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/Carlox1/auto-jklm/main/script.user.js
// @description  Automatiza ciertas acciones en jklm.fun
// @icon         https://jklm.fun/images/icon512.png
// @author       Carlox
// @match        https://phoenix.jklm.fun/games/bombparty/*
// @match        falcon.jklm.fun/*
// ==/UserScript==
let words = []
let usedWords = []
let panelEl = null
let wordsContainer = null
let specialWordsContainer = null
let lastWord = ""


async function getWordsDictionary() {
    const response = await fetch('https://raw.githubusercontent.com/Carlox1/auto-jklm/main/validatedWords.json');
    if (!response.ok) {
        window.alert('Error al obtener el diccionario de palabras');
        window.location.reload();
    }
    const words = await response.json();
    return words;
}


async function simulateHumanInput(el, value) {
    for (let i = 0; i < value.length; i++) {
        el.value += value[i];
        el.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
    }
    socket.emit('setWord', value, true);
}


function getWords(syllable) {
    console.time("getWords")
    const filteredWords = words.filter(w => w.includes(syllable) && !usedWords.includes(w));
    
    wordsContainer.innerHTML = ""
    filteredWords.slice(0, 20).forEach(word => {
        const wordBtn = document.createElement("button")
        wordBtn.className = "styled joinRound"
        wordBtn.innerHTML = word.split(syllable).join(`<span style="text-decoration: underline">${syllable}</span>`)
        wordBtn.style.height = "fit-content"

        wordBtn.addEventListener("click", () => {
            if (!wasSelfTurn) return
            const inputEl = document.querySelector("form > input")
            simulateHumanInput(inputEl, word)
        })

        wordsContainer.appendChild(wordBtn)
    })
    console.timeEnd("getWords")
    getSpecialWords(filteredWords)
}


function getSpecialWords(words) {
    console.time("getSpecialWords")
    const specialWords = []
    const bonusLetters = milestone.playerStatesByPeerId[selfPeerId].bonusLetters
    const bonus = Object.keys(bonusLetters).filter(letter => bonusLetters[letter] > 0)
    words.forEach(word => {
        const bonusCount = Array.from(new Set(word)).filter(letter => bonus.includes(letter)).length
        if (bonusCount >= 1) specialWords.push({
            word,
            bonusCount
        })
    })

    specialWordsContainer.innerHTML = ""
    specialWords.sort((a, b) => b.bonusCount - a.bonusCount).slice(0, 10).forEach(word => {
        const wordBtn = document.createElement("button")
        wordBtn.className = "styled joinRound"
        wordBtn.innerHTML = `<span>${word.word}</span><span style="color: #444444; margin-left: 2px">+${word.bonusCount}</span>`
        wordBtn.style.height = "fit-content"
        wordBtn.style.display = "flex"
        wordBtn.style.backgroundColor = "#ddbb66"

        wordBtn.addEventListener("click", () => {
            if (!wasSelfTurn) return
            const inputEl = document.querySelector("form > input")
            simulateHumanInput(inputEl, word.word)
        })

        specialWordsContainer.appendChild(wordBtn)
    })
    console.timeEnd("getSpecialWords")
}


function createPanel() {
    if (panelEl) return
    const containerEl = document.querySelector("body")

    panelEl = document.createElement("div")
    panelEl.style.width = "350px"
    panelEl.style.height = "100%"
    panelEl.style.backgroundColor = "rgb(32, 32, 32)"
    panelEl.style.display = "flex"
    panelEl.style.flexDirection = "column"
    panelEl.style.gap = "8px"
    panelEl.style.padding = "8px"
    panelEl.style.color = "white"

    wordsContainer = document.createElement("div")
    wordsContainer.style.width = "100%"
    wordsContainer.style.height = "45%"
    wordsContainer.style.overflowY = "auto"
    wordsContainer.style.display = "flex"
    wordsContainer.style.flexWrap = "wrap"
    wordsContainer.style.gap = "4px"
    wordsContainer.style.alignContent = "flex-start"
    wordsContainer.style.backgroundColor = "rgb(48, 48, 48)"
    wordsContainer.style.padding = "8px"
    wordsContainer.style.borderRadius = "8px"

    specialWordsContainer = document.createElement("div")
    specialWordsContainer.style.width = "100%"
    specialWordsContainer.style.height = "45%"
    specialWordsContainer.style.overflowY = "auto"
    specialWordsContainer.style.display = "flex"
    specialWordsContainer.style.flexWrap = "wrap"
    specialWordsContainer.style.gap = "4px"
    specialWordsContainer.style.alignContent = "flex-start"
    specialWordsContainer.style.backgroundColor = "rgb(48, 48, 48)"
    specialWordsContainer.style.padding = "8px"
    specialWordsContainer.style.borderRadius = "8px"

    wordsContainer.innerHTML = `
    <button class="styled joinRound" style="height: fit-content;">Made</button>
    <button class="styled joinRound" style="height: fit-content;">by</button>
    <button class="styled joinRound" style="height: fit-content;">:)</button>
    <button class="styled joinRound" style="height: fit-content;">Carlox</button>
    `

    const wordsTitle = document.createElement("p")
    wordsTitle.innerText = "Palabras:"
    wordsTitle.style.margin = "0px"

    const specialWordsTitle = document.createElement("p")
    specialWordsTitle.innerText = "Palabras especiales:"
    specialWordsTitle.style.margin = "0px"
    specialWordsTitle.style.marginTop = "10px"

    panelEl.appendChild(wordsTitle)
    panelEl.appendChild(wordsContainer)
    panelEl.appendChild(specialWordsTitle)
    panelEl.appendChild(specialWordsContainer)
    containerEl.prepend(panelEl)
}


function resetGame() {
    usedWords = []
    wordsContainer.innerHTML = `
    <button class="styled joinRound" style="height: fit-content;">Made</button>
    <button class="styled joinRound" style="height: fit-content;">by</button>
    <button class="styled joinRound" style="height: fit-content;">Carlox</button>
    <button class="styled joinRound" style="height: fit-content;">:)</button>
    `
    specialWordsContainer.innerHTML = ""
}


(async function () {
    words = await getWordsDictionary();

    setTimeout(() => {
        if (!panelEl) createPanel()
    }, 2000);

    socket.on("setMilestone", (data) => {
        if (wasSelfTurn) getWords(milestone.syllable)
        if (data?.name == "seating") resetGame()
    });

    socket.on("nextTurn", () => {
        if (wasSelfTurn) getWords(milestone.syllable)
    });

    socket.once("setup", async () => {
        createPanel()
    })

    socket.on('setPlayerWord', (_, word) => {
        lastWord = word
    })

    socket.on('correctWord', () => {
        let word = lastWord.replace(/[^a-zA-Z-']/g, '')
        usedWords.push(word)
    });
})();