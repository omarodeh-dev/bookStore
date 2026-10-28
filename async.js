import {fakeRequest, wait, timeout, loadReviews} from './api.js';

const logList = document.getElementById('log');

export function log(message, type ="") {
    const li = document.createElement('li');
    li.textContent = message;
    if(type) {li.className = type;}
    logList.append(li);
}

 // promise.all
async function demoAll() {
    log("Promise.all: loading reviews + authors + prices together ...");
    try {
        const [reviews, authors, prices] = await Promise.all([
            loadReviews(),
            fakeRequest("authors", 1000),
            fakeRequest("prices", 1500)
        ]);
        log(`Promise.all: reviews loaded: ${JSON.stringify(reviews)}`);
        log(`Promise.all: authors loaded: ${authors}`);
        log(`Promise.all: prices loaded: ${prices}`);
    } catch (error) {
        log(`Promise.all: Error occurred: ${error.message}`, "error");
    }
}

 // Promise.allSettled
async function demoAllSettled() {
    log("Promise.allSettled: checking stock in 3 shops...");
    const results = await Promise.allSettled([
        fakeRequest("shop1", 1000),
        fakeRequest("shop2", 1500, true),  // this one will fail
        fakeRequest("shop3", 2000)
    ]);
    log("Promise.allSettled: Stock check results:");
    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            log(`  Shop ${index + 1}: ${result.value}`);
        } else {
            log(`  Shop ${index + 1}: Error - ${result.reason.message}`, "error");
        }
    });
}

// Promise.race
async function demoRace() {
    log("Promise.race: loading reviews with timeout...");
    try {
        const reviews = await Promise.race([
            loadReviews(),
            timeout(2000)  // timeout after 2 seconds
        ]);
        log(`Promise.race: reviews loaded: ${JSON.stringify(reviews)}`);
    } catch (error) {
        log(`Promise.race: Error occurred: ${error.message}`, "error");
    }
}

// Promise.any
async function demoAny() {
    log("Promise.any: checking stock in 3 shops...");
    try {
        const stock = await Promise.any([
            fakeRequest("shop1", 1000, true),  // this one will fail
            fakeRequest("shop2", 1500, true),  // this one will fail
            fakeRequest("shop3", 2000)          // this one will succeed
        ]);
        log(`Promise.any: Stock check successful: ${stock}`);
    } catch (error) {
        log(`Promise.any: All requests failed: ${error.message}`, "error");
    }
}

//Abort Controller
let controller = null;
const slowBtn = document.getElementById('slowBtn');
const cancelBtn = document.getElementById('cancelBtn');

async function demoSlowRequest() {
    controller = new AbortController();
    slowBtn.disabled = true;
    cancelBtn.disabled = false;
    log("Starting a slow request... Press Cancel to stop it.");

    try {
        const result = await fakeRequest("slow", 5000, false, controller.signal);
        log(`Slow request completed: ${result}`);
    } catch (error) {
        if (error.name === 'AbortError') {
            log("Slow request was canceled by the user.", "error");
        } else {
            log(`Slow request failed: ${error.message}`, "error");
        }
    }
    finally {
        slowBtn.disabled = false;
        cancelBtn.disabled = true;
        controller = null;
    }
}

function cancelSlowRequest() {controller?.abort();}

//Event loop

function demoEventLoop() {
    log("Event loop demonstration...");

    fakeRequest("payment" , 1000, true)
    .then((result) => log(`This will not run: ${result}`))
    .catch((error) => log(`Payment request failed: ${error.message}`, "error"));

    fakeRequest("shipping", 500,true); // unhandled rejection

}

window.addEventListener("unhandledrejection", (event) => {
    event.preventDefault();
    log(`Unhandled promise rejection: ${event.reason}`, "error");
});

export function setupAsyncDemo() {
    document.getElementById('allBtn').addEventListener('click', demoAll);
    document.getElementById('allSettledBtn').addEventListener('click', demoAllSettled);
    document.getElementById('raceBtn').addEventListener('click', demoRace);
    document.getElementById('anyBtn').addEventListener('click', demoAny);
    slowBtn.addEventListener('click', demoSlowRequest);
    cancelBtn.addEventListener('click', cancelSlowRequest);
    document.getElementById('loopBtn').addEventListener('click', demoEventLoop);
    logList.innerHTML = ""; // Clear log on setup
}