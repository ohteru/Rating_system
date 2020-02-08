class EventEmitter {
  constructor () {
    this._handlers = {};
  }

  on (type, handler) {
    if (!type in this._handlers) {
      this._handlers[type] = [];
    }
    this._handlers[type].push(handler);
  }

  emit (type, data) {
    const handlers = this._handlers[type] || [];
    for (let i = 0; i < handlers.length; i++) {
      let handler = handlers[i];
      handler.call(this, data);
    }
  }
}


class Store extends EventEmitter {
  constructor (dispatcher) {
    super();

    this.rate = '1';
    this.tempRate = this.rate;
    this.oldRate = this.rate;

    dispatcher.on('updateRate', this.updateRate.bind(this));
    dispatcher.on('saveTempRate', this.saveTempRate.bind(this));
    dispatcher.on('revertRate', this.revertRate.bind(this));
    dispatcher.on('updateOldRate', this.updateOldRate.bind(this));
  }

  get getRate () {
    return this.rate;
  }

  get getTempRate () {
    return this.tempRate;
  }

  get getOldRate () {
    return this.oldRate;
  }

  updateRate (rate) {
    this.rate = rate;
    this.emit('UPDATE');
  }

  saveTempRate (rate) {
    this.tempRate = rate;
    this.emit('TEMP');
  }

  revertRate () {
    this.emit('REVERT');
  }

  updateOldRate (rate) {
    this.oldRate = rate;
  }
}


class ActionCreator {
  constructor (dispatcher) {
    this.dispatcher = dispatcher;
  }

  updateRate (rate) {
    this.dispatcher.emit('updateRate', rate);
  }

  saveTempRate (rate) {
    this.dispatcher.emit('saveTempRate', rate);
  }

  revertRate () {
    this.dispatcher.emit('revertRate');
  }

  updateOldRate (rate) {
    this.dispatcher.emit('updateOldRate', rate);
  }
}



const baseClassName = 'Rating';
const target = document.querySelector(`.${baseClassName}`);
const starList = document.querySelectorAll(`.${baseClassName}__star`);
const activeClassName = `${baseClassName}__star--active`;
const hoverClassName = `${baseClassName}--hover`;

const dispatcher = new EventEmitter();
const action = new ActionCreator(dispatcher);
const store = new Store(dispatcher);


/**
 * 差分だけ処理
 * @param {number}
 * @param {number}
 */
const starActiveHandler = (oldValue, value) => {
  if (oldValue === value) {
    return;
  }

  if (oldValue < value) {
    for (let i = oldValue; i < value; i++) {
      starList[i].classList.add(activeClassName);
    }
    return;
  }

  if (oldValue > value) {
    for (let i = oldValue; i > value; i--) {
      // index用の -1
      starList[i - 1].classList.remove(activeClassName);
    }
    return;
  }
}


store.on('UPDATE', () => {
  const {
    getRate: rate,
    getOldRate: oldRate,
  } = store;

  action.updateOldRate(rate);
  starActiveHandler(oldRate, rate);
  target.classList.remove(hoverClassName);
})

store.on('TEMP', () => {
  const {
    getTempRate: tempRate,
    getOldRate: oldRate,
  } = store;

  action.updateOldRate(tempRate);
  starActiveHandler(oldRate, tempRate);
  target.classList.add(hoverClassName);
})

store.on('REVERT', () => {
  const {
    getTempRate: tempRate,
    getRate: rate,
  } = store;

  action.updateOldRate(rate);
  starActiveHandler(tempRate, rate);
  target.classList.remove(hoverClassName);
})


// 各種EventHandlerを定義
const clickEventHandler = rating => () => action.updateRate(rating);
const hoverEventHandler = rating => () => action.saveTempRate(rating);
const mouseleaveEventHandler = () => action.revertRate();


// Event付与
starList.forEach(star => {
  const rating = star.dataset.rating;
  star.addEventListener('click', clickEventHandler(rating))
  star.addEventListener('mouseover', hoverEventHandler(rating))
})

target.addEventListener('mouseleave', mouseleaveEventHandler);
