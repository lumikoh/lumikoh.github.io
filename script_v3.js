let TEMPLATE_neoGemItems = []
let TEMPLATE_neoStoneItems = []

//time handling
let weeksLeft = "0"
let daysLeft = "0"
let hoursLeft = "00"
let minutesLeft = "00"
let secondsLeft = "00"




const app = Vue.createApp({
    data() {
        return {
            initialized: false,
            input: null,

            SHARED_characters: [],
            SHARED_neoCoreItems: [],
            SHARED_mesoItems: [],
            SHARED_neoStoneItems: [],

            currentCores: null,
            neededCores: null,
            currentMesos: null,
            neededMesos: null,
            currentGems: null,
            neededGems: null,
            currentStones: null,
            neededStones: null,

            activeItem: null,
            activeChar: null
        }
        
    },
    mounted() {
        timeLeft()
        const initialized = JSON.parse(localStorage.getItem("initialized"))

        if (!initialized) 
            fetchData_init()
        else {
            this.SHARED_characters = JSON.parse(localStorage.getItem("SHARED_characters"))
            this.SHARED_neoCoreItems = JSON.parse(localStorage.getItem("SHARED_neoCoreItems"))
            this.SHARED_mesoItems = JSON.parse(localStorage.getItem("SHARED_mesoItems"))
            this.SHARED_neoStoneItems = JSON.parse(localStorage.getItem("SHARED_neoStoneItems"))
            TEMPLATE_neoGemItems = JSON.parse(localStorage.getItem("TEMPLATE_neoGemItems"))
            TEMPLATE_neoStoneItems = JSON.parse(localStorage.getItem("TEMPLATE_neoStoneItems"))

            this.currentCores = JSON.parse(localStorage.getItem("currentCores"))
            this.currentMesos = JSON.parse(localStorage.getItem("currentMesos"))

            this.initialized = true
        }
    },
    watch: {
        SHARED_characters: {
            handler: function(updated) { 
                localStorage.setItem("SHARED_characters", JSON.stringify(updated))
                this.updateCharCurrencies()
            },
            deep: true
        },
        SHARED_neoCoreItems: {
            handler: function(updated) { 
                localStorage.setItem("SHARED_neoCoreItems", JSON.stringify(updated))
                this.updateCharCurrencies()
            },
            deep: true
        },
        SHARED_mesoItems: {
            handler: function(updated) { 
                localStorage.setItem("SHARED_mesoItems", JSON.stringify(updated))
                this.updateCharCurrencies()
            },
            deep: true
        },
        SHARED_neoStoneItems: {
            handler: function(updated) { 
                localStorage.setItem("SHARED_neoStoneItems", JSON.stringify(updated))
                this.updateCharCurrencies()
            },
            deep: true
        },
        initialized(updated) {
            localStorage.setItem("initialized", updated)
        },
        currentCores(updated) {
            localStorage.setItem("currentCores", JSON.stringify(updated))
        },
        currentMesos(updated) {
            localStorage.setItem("currentMesos", JSON.stringify(updated))
        },
    },
    methods: {
        getCurrentCharIndex()
        {
            return this.SHARED_characters.map((character) => character.isActive).indexOf(true)
        },
        updateCharCurrencies()
        {
            if (this.initialized === false) return

            // per character
            const charIndex = this.getCurrentCharIndex()
            if (charIndex === -1) return
            
            let neoGemSum = 0
            this.SHARED_characters[charIndex].PER_CHARACTER_neoGemItems.forEach(item => {
                neoGemSum += item.wanted * item.cost
            })
            this.neededGems = neoGemSum
            
            let neoStoneSum = 0
            this.SHARED_characters[charIndex].PER_CHARACTER_neoStoneItems.forEach(item => {
                neoStoneSum += item.wanted * item.cost
            })
            this.neededStones = neoStoneSum

            // shared
            let neoCoreSum = 0
            this.SHARED_neoCoreItems.forEach(item => {
                neoCoreSum += item.wanted * item.cost
            })
            this.neededCores = neoCoreSum
            
            let mesoSum = 0
            this.SHARED_mesoItems.forEach(item => {
                mesoSum += item.wanted * item.cost
            })
            this.neededMesos = mesoSum

        },

        showPurchaseOverlay(item, event)
        {
            event.target.parentElement.getElementsByClassName('wanted')[0].blur()
            document.getElementById('overlay-purchase').style.display = 'block'

            this.activeItem = item
            document.getElementById('amountToBuy').innerText = item.wanted
        },
        showDeleteCharOverlay(character)
        {
            document.getElementById('char-to-delete').innerText = character.name
            document.getElementById('overlay-delete-char').style.display = 'block'
            this.activeChar = character
        },

        showResetStockOverlay() {
            document.getElementById("item-to-reset").innerText = this.activeItem.name
            document.getElementById("overlay-reset-stock").style.display = "block"
        },

        resetStock() {
            this.activeItem.bought = 0
            this.hideOverlay('overlay-reset-stock')
        },

        hideOverlay(overlayID) {
            document.getElementById(overlayID).style.display = 'none'
        },

        buyItem(){
            /* const input = document.getElementById('amountToBuy').textContent
            const parsed = parseInt(input, 10)
            if (isNaN(parsed)) return
            const amount = parsed */

            document.getElementById('amountToBuy').blur()

            let item = this.activeItem
            let amount = parseInt(document.getElementById('amountToBuy').textContent, 10)

            this.hideOverlay('overlay-purchase')
            if(item.limit === "Unlimited") {
                item.wanted = Math.max(item.wanted - amount, 0)
                return
            }
            
            const charIndex = this.getCurrentCharIndex()

            if(item.currency === "Neo Stone") {
                this.SHARED_characters[charIndex].currentStones = Math.max(this.currentCores - (item.cost * amount), 0)
            }

            if(item.currency === "Neo Gem") {
                this.SHARED_characters[charIndex].currentGems = Math.max(this.currentCores - (item.cost * amount), 0)
            }

            if(item.currency === "Neo Core") {
                this.currentCores = Math.max(this.currentCores - (item.cost * amount), 0)
            }

            
            if(!this.isSharedStoneItem(item)) {

                if(item.restock === "weekly") {
                    item.bought = Math.min(item.bought + amount, item.limit * weeksLeft + 1)
                    item.wanted = Math.max(item.wanted - amount, 0)
                    return
                }
                if(item.restock === "daily") {
                    item.bought = Math.min(item.bought + amount, item.limit * (weeksLeft * 7 + daysLeft + 1))
                    item.wanted = Math.max(item.wanted - amount, 0)
                    return
                }
                
                item.bought = Math.min(item.bought + amount, item.limit)
                item.wanted = Math.max(item.wanted - amount, 0)
                return
            }
            
            this.SHARED_neoStoneItems.forEach(stoneItem => {
                if(stoneItem.name === item.name) {
                    stoneItem.bought = Math.min(stoneItem.bought + amount, stoneItem.limit)
                    item.wanted = Math.max(item.wanted - amount, 0)
                    return
                }
            });
            
        },

        resetItemsBought(item) {
            if(!this.isSharedStoneItem(item)) {
                item.bought = 0
                return
            }
            this.SHARED_neoStoneItems.forEach(stoneItem => {
                if(stoneItem.name === item.name) {
                    stoneItem.bought = 0
                    return
                }
            })
        },
        
        handleRemain(item)
        {
            if(item.limit === "Unlimited") {
                return "∞"
            }

            return this.calculateLimit(item) - item.wanted; 
        },

        calculateLimit(item) {
            let limit= item.limit
            if(this.isSharedStoneItem(item)) {    
                const otherCharacters = this.SHARED_characters.filter(character => !character.isActive)
                otherCharacters.forEach(character => {
                    character.PER_CHARACTER_neoStoneItems.forEach(stoneItem => {
                    if (stoneItem.name === item.name) {
                            limit -= stoneItem.wanted
                        }
                    });
                });
                this.SHARED_neoStoneItems.forEach(stoneItem => {
                    if (stoneItem.name === item.name) {
                        limit += stoneItem.limit - item.limit - stoneItem.bought
                    }
                })
            }

            if(item.restock === "weekly") {
                return limit * weeksLeft + 1 - item.bought
            }
            if(item.restock === "daily") {
                return limit * (weeksLeft * 7 + daysLeft + 1) - item.bought
            }

            return limit - item.bought
        },

        isSharedStoneItem(item) {
            if(item.currency === "Neo Stone" && !item.perCharacter) {
                return true
            }
            return false
        },

        isInfinite(limit)
        {
            if(limit === "Unlimited")
                return true
        },
        autoHighlight(event)
        {
            const cell = event.target;
            let range, selection;
            if (document.body.createTextRange) {
                range = document.body.createTextRange();
                range.moveToElementText(cell);
                range.select();
            } else if (window.getSelection) {
                selection = window.getSelection();
                range = document.createRange();
                range.selectNodeContents(cell);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        },
        
        openShop(event)
        {
            if (event.target.classList.contains('fa-caret-up')) {
                event.target.className = 'toggle fas fa-caret-down'
            } else 
                event.target.className = 'toggle fas fa-caret-up'

            const itemsEl = event.target.parentElement.nextElementSibling
            document.getElementById("shops").querySelectorAll(".items").forEach((el) => {
                if (el != itemsEl)  el.className = 'items inactive'
            })
            document.getElementById("shops").querySelectorAll(".toggle").forEach((el) => {
                if (el != event.target)  el.className = 'toggle fas fa-caret-down'
            })
            itemsEl.classList.toggle('inactive')
        },
        inActivateCharacters(){
            this.SHARED_characters.forEach(character => {
                character.isActive = false
            })
        },
        addCharacter(event) 
        {
            if (this.input == null || this.input === '') return
            this.inActivateCharacters()
            const id = Date.now()
            this.SHARED_characters.push({
                name: this.input,
                id: id,
                PER_CHARACTER_neoStoneItems: JSON.parse(JSON.stringify(TEMPLATE_neoStoneItems)),
                PER_CHARACTER_neoGemItems: JSON.parse(JSON.stringify(TEMPLATE_neoGemItems)),
                currentStones: 0,
                currentGems: 0,
                isActive: true
            })
            this.input = ''
            event.target.firstChild.blur()
        },
        addDefaultCharacter() 
        {
            const id = Date.now()
            this.SHARED_characters.push({
                name: 'Default char name',
                id: id,
                PER_CHARACTER_neoStoneItems: JSON.parse(JSON.stringify(TEMPLATE_neoStoneItems)),
                PER_CHARACTER_neoGemItems: JSON.parse(JSON.stringify(TEMPLATE_neoGemItems)),
                currentStones: 0,
                currentGems: 0,
                isActive: true
            })
            
            
        },
        setCurrentChar(character)
        {
            if (character.isActive) return
            this.inActivateCharacters()
            character.isActive = true

        },
        editItemWanted(item, event)
        {
            const input = event.target.textContent
            const parsed = parseInt(input, 10)
            
            if (isNaN(parsed)) {
                item.wanted = 0
                event.target.textContent = 0
            }
            else {
                let remaining = this.calculateLimit(item);
                if (item.limit !== 'Unlimited' && parsed >= remaining) {
                    item.wanted = remaining
                    event.target.textContent = remaining
                } 
                 else {
                    item.wanted = parsed    
                }
            } 
            event.target.blur()
        },
        editItemBought(item, event) {

            const input = event.target.textContent
            const parsed = parseInt(input, 10)
            if (isNaN(parsed)) {
                event.target.textContent = 0
            }
            else {
                let remaining = this.calculateLimit(item);
                if(item.limit !== "Unlimited" && parsed >= remaining) {
                    event.target.textContent = remaining
                }

            }
            event.target.blur()
        },
        editCurrentCurrency(event, currency, character)
        {
            const input = event.target.textContent
            const parsed = parseInt(input, 10)

            if (isNaN(parsed)) {
                if (currency === 'core'){ 
                    event.target.textContent = 0
                    this.currentCores = 0
                }
                if (currency === 'meso'){ 
                    event.target.textContent = 0
                    this.currentMesos = 0
                }
                if (currency === 'stone'){ 
                    event.target.textContent = 0
                    character.currentStones = 0
                }
                if (currency === 'gem') {
                    event.target.textContent = 0
                    character.currentGems = 0
                }
            }
            else {
                if (currency === 'core') 
                    this.currentCores = parsed
                if (currency === 'meso') 
                    this.currentMesos = parsed
                if (currency === 'stone') 
                    character.currentStones = parsed
                if (currency === 'gem') 
                    character.currentGems = parsed
            }
            event.target.blur()
        },
        abbreviateNumber(number)
        {

            // what tier? (determines SI symbol)
            var tier = Math.log10(Math.abs(number)) / 3 | 0
        
            // if zero, we don't need a suffix
            if(tier == 0) return number
        
            // get suffix and determine scale
            var suffix = SI_SYMBOL[tier]
            var scale = Math.pow(10, tier * 3)
        
            // scale the number
            var scaled = number / scale
        
            // format number and add suffix
            return scaled + suffix
        },
        isStockEmpty(item)
        {
            if (this.handleRemain(item) === 0 ) {
                return true
            }
        },
        resetAndReload()
        {
            localStorage.clear()
            window.location.reload()
        },
        deleteItem(location, item)
        {
            if (location === 'SHARED_neoCoreItems' || location === 'SHARED_mesoItems')
            {
                this[location].splice(this[location].indexOf(item), 1)
            } 
            else
            {
                this.SHARED_characters[location].splice(this[location].SHARED_characters.indexOf(item), 1)
            }
        },
        deleteCharacter(character)
        {
            // if to be deleted char is currently active
            if (character.isActive)
            {
                // if there are no other characters -> create default character
                // otherwise change current char to first of remaining characters
                const otherCharacters = this.SHARED_characters.filter(otherCharacter => otherCharacter.id !== character.id)
                if (otherCharacters.length === 0)
                {
                    this.addDefaultCharacter()
                }
                else   
                {
                    this.inActivateCharacters()
                    const otherCharIndex = this.SHARED_characters.map((character) => character.id).indexOf(otherCharacters[0].id)
                    this.SHARED_characters[otherCharIndex].isActive = true

                }
            // delete wanted char from characters
            this.SHARED_characters.splice(this.SHARED_characters.indexOf(character), 1)
            this.hideOverlay('overlay-delete-char')
            }
        },
        editCharButton(event){ 
            const nameElement = event.target.previousSibling
            nameElement.setAttribute('contenteditable', true)
            nameElement.setAttribute('tabindex', 0)
            setTimeout(function() {
                nameElement.focus();
            }, 0);
        },
        editCharName(character, event) {
            const input = event.target.textContent

            if (input == null || input === '') {
                event.target.textContent = character.name
            }
            else {
                character.name = input
            }
            event.target.removeAttribute('contenteditable')
            event.target.removeAttribute('tabindex')
            event.target.blur()
        }
    }
})

setInterval(timeLeft, 1000)



function timeLeft() {
    let date = new Date()
    let endDate = new Date(Date.UTC(2021,7,24,23,59,59))
    let timeRemaining = endDate - date
    let seconds = (timeRemaining /1000) | 0
    let minutes = (seconds / 60) | 0
    seconds -= minutes * 60
    let hours = (minutes / 60) | 0
    minutes -= hours * 60
    let days = (hours / 24) | 0
    hours -= days *24
    let weeks = (days / 7) | 0
    days -= weeks * 7

    if(seconds < 10) {
        seconds = "0" + seconds 
    }
    if(minutes < 10) {
        minutes = "0" + minutes
    }
    if (hours < 10) {
        hours = "0" + hours
    }
    weeksLeft = weeks
    daysLeft = days
    hoursLeft = hours
    minutesLeft = minutes
    secondsLeft = seconds

    let hoursToString = hours + ":" + minutes + ":" + seconds
    document.getElementById('weeksNumber').innerText = weeksLeft
    document.getElementById('daysNumber').innerText = daysLeft
    document.getElementById('hoursNumber').innerText = hoursToString

}


const vm = app.mount('#app')


function isNumber(evt) {
    evt = (evt) ? evt : window.event
    var charCode = (evt.which) ? evt.which : evt.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false
    }
    return true
}

function fetchData_init()
{
    fetch('data.json')
        .then(response => response.json() )
        .then(data => setInitData(data) )
}

function setInitData(data)
{
    data.forEach(function (item) {
        if(item.limit !== "Unlimited") 
            item.limit = parseInt(item.limit)
        item.wanted = 0
        item.bought = 0
        item.image = 'img/' + item.image
        item.cost = 
            parseInt(
                item.cost.replace(/,/g, "")
            )   
    });

    vm.SHARED_neoCoreItems = data.filter(item => item.currency === 'Neo Core')
    vm.SHARED_mesoItems = data.filter(item => item.currency === 'Meso')

    TEMPLATE_neoGemItems = data.filter(item => item.currency === 'Neo Gem')
    TEMPLATE_neoStoneItems = data.filter(item => item.currency === 'Neo Stone')
    vm.SHARED_neoStoneItems = TEMPLATE_neoStoneItems.filter(item => !item.perCharacter)
    localStorage.setItem("TEMPLATE_neoGemItems", JSON.stringify(TEMPLATE_neoGemItems))
    localStorage.setItem("TEMPLATE_neoStoneItems", JSON.stringify(TEMPLATE_neoStoneItems))

    vm.currentCores = 0
    vm.currentMesos = 0
    vm.initialized = true
    vm.addDefaultCharacter()
    vm.updateCharCurrencies()
}


let SI_SYMBOL = ["", " k", " Mil", " Bil", "T", "P", "E"];