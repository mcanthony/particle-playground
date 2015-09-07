// GRAPHICAL USER INTERFACE CONTROLLER

import defaults from '../node_modules/defaults';
// import defaults from '~defaults/index.js';

// Webpack: load stylesheet
require('../assets/styles/gui.less');

export class Bin {
	constructor(title, type, open = true) {
		this.title = title;
		this.type = type;
		this.height = 0;
		this.container = null;
		this.controllers = [];
		this.node = null;
		this.node = document.createElement('div');
		this.node.classList.add('bin');

		let titlebar = document.createElement('div');
		titlebar.classList.add('bin-title-bar');
		titlebar.addEventListener('click', e => { this.toggle(); });

		let icon = document.createElement('i');
		icon.classList.add('ion-ios-arrow-right');
		titlebar.appendChild(icon);

		let label = document.createElement('span');
		label.classList.add('bin-title');
		label.innerText = this.title;
		titlebar.appendChild(label);

		this.node.appendChild(titlebar);

		this.container = document.createElement('div');
		this.container.classList.add('bin-container');
		this.container.classList.add(`bin-${this.type}`);
		this.node.appendChild(this.container);

		this.setHeight(this.height);

		if (open) { this.open(); }
	}

	isOpen() { return this.node.classList.contains('open'); }

	open() {
		this.node.classList.add('open');
		this.setHeight(this.height);
	}

	close() {
		this.node.classList.remove('open');
		this.setHeight(0);
	}

	toggle() {
		if (this.isOpen()) { this.close(); }
		else { this.open(); }
	}

	setHeight(h) {
		this.container.style.height = `${h}px`;
	}

	addController(controller) {
		this.controllers.push(controller);
		this.container.appendChild(controller.node);
		controller.parent = this;
		this.height += controller.height;
		if (this.isOpen()) { this.setHeight(this.height); }
	}

	addControllers(...controllers) {
		controllers.forEach(this.addController.bind(this));
	}

	removeController(controller) {
		this.height -= controller.height;
		controller.destroy();
		this.setHeight(this.height);
		let i = this.controllers.indexOf(controller);
		delete this.controllers[i];
		// this.controllers.splice(i, 1);
	}

	removeAllControllers() {
		this.controllers.forEach(this.removeController.bind(this));
		this.controllers.length = 0;
	}

	disable() {
		this.controllers.forEach(controller => {
			controller.disable();
		});
	}
}

class Controller {
	constructor(type, title) {
		this.title = title;
		this.type = type;
		this.node = document.createElement('div');
		this.node.classList.add('bin-item', 'controller', type);
		this.parent = null;
		this.height = null;
		this.updater = null;
		this.enabled = false;
		// this.node.appendChild();
	}

	setState(s) {
		this.enabled = s;
		if (this.enabled) {this.node.classList.remove('disabled'); }
		else { this.node.classList.add('disabled'); }
	}

	setValue(val) {
		this.value = val;
	}

	listener(e) {
		this.setValue(e.target.value);
		// console.log(`Setting ${this.title}: ${this.value}`);
		// this.options.onchange(this.value);
	}

	watch(getter) {
		this.getter = getter;
		this.setState(false);
		this.update();
		return this;
	}

	update() {
		this.updater = requestAnimationFrame(this.update.bind(this));
		this.setValue(this.getter());
	}

	unwatch() {
		cancelAnimationFrame(this.updater);
		this.setState(true);
	}

	rewatch() {
		this.setState(false);
		this.update();
	}

	disable() {
		this.setState(false);
	}

	enable() {
		this.setState(true);
	}

	destroy() {
		// TODO: ensure properly destruction
		this.node.parentNode.removeChild(this.node);
		this.unwatch();
		this.node = null;
		this.parent = null;
		this.getter = null;
	}
}

export class TextController extends Controller {
	constructor(title, value, opts) {
		super('text', title);
		this.value = value;
		this.height = 48;

		// Set default options
		this.options = defaults(opts, {
			size: Number.MAX_VALUE,
			onchange: function (e) {}
		});

		let label = document.createElement('label');

		let name = document.createElement('span');
		name.classList.add('bin-item-name');
		name.innerText = title;
		label.appendChild(name);

		this.input = document.createElement('input');
		this.input.classList.add('bin-item-value');
		this.input.type = 'text';
		this.input.value = this.value;
		label.appendChild(this.input);

		this.node.appendChild(label);

		this.input.addEventListener('change', this.listener.bind(this));
	}

	setState(s) {
		this.enabled = s;
		this.input.disabled = !s;
		if (this.enabled) {this.node.classList.remove('disabled'); }
		else { this.node.classList.add('disabled'); }
	}

	setValue(val) {
		this.value = val;
		this.input.value = this.value;
	}

	listener(e) {
		this.value = e.target.value;
		// console.log(`Setting ${this.title}: ${this.value}`);
		this.options.onchange(this.value);
	}
}

export class NumberController extends Controller {
	constructor(title, value, opts) {
		super('number', title);
		this.value = value;
		this.height = 48;

		// Set default options
		this.options = defaults(opts, {
			min: null,
			max: null,
			step: null,
			decimals: 3,
			onchange: function (val) {}
		});

		let label = document.createElement('label');

		let name = document.createElement('span');
		name.classList.add('bin-item-name');
		name.innerText = title;
		label.appendChild(name);

		this.input = document.createElement('input');
		this.input.classList.add('bin-item-value');
		this.input.type = 'number';
		this.input.value = this.value;
		if (this.options.min !== null) this.input.min = this.options.min;
		if (this.options.max !== null) this.input.max = this.options.max;
		if (this.options.step !== null) this.input.step = this.options.step;
		label.appendChild(this.input);

		this.node.appendChild(label);

		this.input.addEventListener('change', this.listener.bind(this));
	}

	setValue(val) {
		this.value = val;
		this.input.value = this.value.toFixed(this.options.decimals);
	}

	setState(s) {
		this.enabled = s;
		this.input.disabled = !s;
		if (this.enabled) {this.node.classList.remove('disabled'); }
		else { this.node.classList.add('disabled'); }
	}

	listener(e) {
		this.value = e.target.value;
		// console.log(`Setting ${this.title}: ${this.value}`);
		this.options.onchange(parseFloat(this.value));
	}
}

export class ToggleController extends Controller {
	constructor(title, value, opts) {
		super('toggle', title);
		this.value = value;
		this.height = 48;

		// Set default options
		this.options = defaults(opts, {
			onchange: function () {}
		});

		let label = document.createElement('label');

		let name = document.createElement('span');
		name.classList.add('bin-item-name');
		name.innerText = title;
		label.appendChild(name);

		this.input = document.createElement('input');
		this.input.classList.add('bin-item-value', 'icon');
		this.input.type = 'checkbox';
		this.input.checked = this.value;
		label.appendChild(this.input);

		this.node.appendChild(label);

		this.input.addEventListener('change', this.listener.bind(this));
	}

	setValue(val) {
		this.value = val;
		this.input.value = this.value;
	}

	setState(s) {
		this.enabled = s;
		this.input.disabled = !s;
		if (this.enabled) {this.node.classList.remove('disabled'); }
		else { this.node.classList.add('disabled'); }
	}

	listener(e) {
		this.value = e.target.checked;
		// console.log(`Toggling ${this.title}: ${this.value ? 'on' : 'off'}`);
		this.options.onchange(this.value);
	}
}

export class ActionController extends Controller {
	constructor(title, opts) {
		super('action', title);
		this.height = 48;

		// Set default options
		this.options = defaults(opts, {
			action: function (e) {}
		});

		let label = document.createElement('label');

		let name = document.createElement('span');
		name.classList.add('bin-item-name');
		name.innerText = title;
		label.appendChild(name);

		this.input = document.createElement('button');
		this.input.classList.add('bin-item-value', 'icon');
		// this.input.type = 'button';
		label.appendChild(this.input);

		this.node.appendChild(label);

		this.input.addEventListener('click', this.listener.bind(this));
	}

	setValue(val) {
		this.value = val;
		this.input.value = this.value;
	}

	setState(s) {
		this.enabled = s;
		this.input.disabled = !s;
		if (this.enabled) {this.node.classList.remove('disabled'); }
		else { this.node.classList.add('disabled'); }
	}

	listener(e) {
		// console.log(`Running ${this.title}`);
		this.options.action(e);
	}
}

export class DropdownController extends Controller {
	constructor(title, items, opts) {
		super('dropdown', title);
		// this.value = value;
		this.height = 48;

		// Set default options
		this.options = defaults(opts, {
			onselect: function () {}
		});

		let label = document.createElement('label');

		let name = document.createElement('span');
		name.classList.add('bin-item-name');
		name.innerText = title;
		label.appendChild(name);

		this.input = document.createElement('select');
		this.input.classList.add('bin-item-value');
		this.createItems(items);
		label.appendChild(this.input);

		this.node.appendChild(label);

		this.input.addEventListener('change', this.listener.bind(this));
	}

	createItems(list) {
		this.items = list;
		this.items.forEach(item => {
			let itemNode = document.createElement('option');
			itemNode.value = item.value;
			itemNode.innerText = item.hasOwnProperty('name') ? item.name : item.value;
			if (item.selected) {
				itemNode.selected = true;
				// this.value = item.value;
			}
			if (item.disabled) { itemNode.disabled = true; }
			this.input.appendChild(itemNode);
		});
	}

	setValue(val) {
		this.value = val;
		this.input.value = this.value;
	}

	setState(s) {
		this.enabled = s;
		this.input.disabled = !s;
		if (this.enabled) {this.node.classList.remove('disabled'); }
		else { this.node.classList.add('disabled'); }
	}

	listener(e) {
		this.value = this.input.value;
		// console.log(`Setting ${this.title}: ${this.value}`);
		this.options.onselect(this.value);
	}
}

export class HTMLController extends Controller {
	constructor(title, opts) {
		super('html', title);
		this.height = 160;
	}

	getHTML() { return this.node.innerHTML; }
	setHTML(content) { this.node.innerHTML = content; }
	// append(text) {}
}

export class GridController extends Controller {
	constructor(title, items, opts) {
		super('grid', title);
		this.height = 0;

		// Set default options
		this.options = defaults(opts, {
			size: 'medium',
			type: 'select'
		});

		this.node = document.createDocumentFragment();
		this.createItems(items);
		this.selectedIndex = 0;
		this.multiSelection = [];
	}

	createItems(list) {
		this.height = 48 * Math.ceil(list.length / Math.floor(256 / 48));

		let i = 0;
		this.items = list;
		this.items.forEach(item => {
			item.node = document.createElement('div');
			item.node.classList.add('bin-item');
			item.node.dataset.index = i++;
			item.node.title = item.tooltip;
			if (item.selected) { item.node.classList.add('selected'); }
			if (item.disabled) { item.node.classList.add('disabled'); }
			if (this.options.type === 'toggle' || item.type === 'toggle') { item.alt = false; }
			item.node.addEventListener('click', e => { this.listener(e); });
			// item.node.addEventListener('click', item.onclick);
			item.iconNode = document.createElement('i');
			if (item.hasOwnProperty('icon') && item.icon.length > 0) { item.iconNode.classList.add(item.icon); }
			else if (item.hasOwnProperty('shortcut') && item.shortcut.length > 0) { item.iconNode.innerText = item.shortcut.toUpperCase().charAt(0); }
			item.node.appendChild(item.iconNode);
			this.node.appendChild(item.node);
		});
	}

	listener(e) {
		let el = e.target, i, type;
		while (el.parentElement !== null && typeof el.dataset.index === 'undefined') {
			el = el.parentElement;
		}
		if (typeof el.dataset.index !== 'undefined') {
			i = parseInt(el.dataset.index);
			type = this.options.type === 'mixed' ? this.items[i].type : this.options.type;
			// console.log(type);
			if (type === 'select') { this.select(i); }
			else if (type === 'toggle') { this.toggle(i); }
			else if (type === 'action') {
				if (!this.items[i].disabled) { this.items[i].action.call(this, el); }
			}
		}
	}

	select(i) {
		let children = Array.prototype.slice.call(this.parent.container.childNodes, 0);
		if (this.items[i].disabled) { return; }

		this.multiSelection.length = 0;
		// Deselect all
		this.selectedIndex = i;
		children.forEach(el => {
			el.classList.remove('selected');
		});
		// el = this.parent.container.querySelector(`.bin-item[data-index=${i}]`);
		children[i].classList.add('selected');
		this.items[i].onselect(children[i]);
	}

	toggle(i) {
		let item = this.items[i];
		if (item.disabled) { return; }

		item.alt = !item.alt;
		item.node.classList.toggle('alt');
		// console.log(item);
		item.node.title = item.alt ? item.tooltip_alt : item.tooltip;
		item.iconNode.className = item.alt ? item.icon_alt : item.icon;
		item.onchange(item.node);
	}

	multiSelect(i) {}

	disable() {
		this.items.forEach(item => {
			item.disabled = true;
			item.node.classList.add('disabled');
		});
	}
}

export class CanvasController extends Controller {
	constructor(opts) {
		super('canvas', 'canvas');
		this.height = 160;
		this.node = document.createElement('canvas');
		this.ctx = this.node.getContext('2d');
		this.node.height = this.height;
		this.node.width = 256;
	}
}

export class InfoController extends Controller {
	constructor(title, getter, opts) {
		super('info', title);
		this.height = 48;
		this.getter = getter;

		// Set default options
		this.options = defaults(opts, {
			interval: 100,
			decimals: 2,
			format: 'auto'
		});

		let label = document.createElement('label');

		let name = document.createElement('span');
		name.classList.add('bin-item-name');
		name.innerText = title;
		label.appendChild(name);

		this.input = document.createElement('input');
		this.input.classList.add('bin-item-value');
		this.input.type = 'text';
		this.input.value = getter();
		this.input.disabled = true;
		label.appendChild(this.input);

		this.node.appendChild(label);

		this.watch();
	}

	watch() {
		setTimeout(this.watch.bind(this), this.options.interval);
		this.setInfo(this.getter());
	}

	setInfo(value) {
		let infoString, vx, vy;

		switch(this.options.format) {
			case 'text': infoString = value; break;
			case 'boolean': infoString = value ? 'True' : 'False'; break;
			case 'number': infoString = value.toFixed(this.options.decimals); break;
			case 'vector':
				vx = value.x.toFixed(this.options.decimals);
				vy = value.y.toFixed(this.options.decimals);
				infoString = `(${vx}, ${vy})`;
				break;
			default: infoString = value.toString();
		}
		this.input.value = infoString;
	}
}

export class ColorController extends Controller {
	constructor(title, value, opts) {
		super('color', title);
		// this.value = value;
		this.height = 48;

		// Set default options
		this.options = defaults(opts, {
			onchange: function () {}
		});

		let label = document.createElement('label');

		let name = document.createElement('span');
		name.classList.add('bin-item-name');
		name.innerText = title;
		label.appendChild(name);

		this.input = document.createElement('input');
		this.input.type = 'color';
		this.input.classList.add('bin-item-value');
		label.appendChild(this.input);

		this.node.appendChild(label);

		this.input.addEventListener('change', this.listener.bind(this));
	}

	setState(s) {
		this.enabled = s;
		this.input.disabled = !s;
		if (this.enabled) {this.node.classList.remove('disabled'); }
		else { this.node.classList.add('disabled'); }
	}

	setValue(val) {
		this.value = val;
		this.input.value = this.value;
	}

	listener(e) {
		this.value = this.input.value;
		// console.log(`Setting ${this.title}: ${this.value}`);
		this.options.onchange(this.value);
	}
}

export class Pane {
	constructor(container, opts) {
		// Set default options
		this.options = defaults(opts, {});
		this.bins = [];
		this.width = 256;
		this.node = document.createElement('div');
		this.node.classList.add('gui-pane');

		container.appendChild(this.node);
	}

	addBin(bin) {
		this.bins.push(bin);
		this.node.appendChild(bin.node);
	}

	disableAll() {
		this.bins.forEach(bin => {
			bin.disable();
		});
	}
}
