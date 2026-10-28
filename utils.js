export const formatPrice = (price) => `$${price.toFixed(2)}`; // Pure function
export const getTotal = (cart) =>cart.reduce((total, item) => total + item.price * item.quantity, 0);
export const sumAll = (...numbers) => numbers.reduce((total, num) => total + num, 0);

// closure
export const createCounter = () => {
  let count = 0;
  return () => {
    count ++;
    return count;
  };
};

//Debounce and Throttle functions
export const debounce = (func, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
};
export const throttle = (func, limit) => {
    let waiting = false;
    return (...args) => {
        if (waiting) return;
        func(...args);
        waiting = true;
        setTimeout(() => {
            waiting = false;
        }, limit);
    };
};

//HOF

export const withLog = (name, func) => {
    return (...args) => {
        console.log(`Calling ${name} with arguments:`, args);
        return func(...args);
    };
};