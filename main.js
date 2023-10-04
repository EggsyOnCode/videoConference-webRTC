var States;
(function (States) {
    States[States["open"] = 0] = "open";
    States[States["close"] = 1] = "close";
    States[States["pending"] = 2] = "pending";
})(States || (States = {}));
console.log(States.open);
