//APIs

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//fake Requests

export function fakeRequest(name,ms,shouldFail=false,signal) {
    return new Promise((resolve, reject) => {
        if(signal?.aborted) {
            reject(new DOMException('Request aborted', 'AbortError'));
            return;
        } 

    const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Request aborted', 'AbortError'));
    };

    const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        if (shouldFail) {
            reject(new Error(`Request ${name} failed`));
        } else {
            resolve(`Request ${name} succeeded`);
        }
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
    });
}

// promise that rejects after timeout

export const timeout = (ms) => 
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms));

//real fetch request
let reviewsPromise = null;
export function loadReviews() {
    if(!reviewsPromise) {
        reviewsPromise = fetch("reviews.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch((error) => {
            console.error("Failed to load reviews:", error);
            reviewsPromise = null; // allow retry on next call
            throw error;
        });
    }
    return reviewsPromise;
}

export async function getReviewsForBook(bookId) {
    const reviews = await loadReviews();
    return reviews[bookId] ?? [];
}
