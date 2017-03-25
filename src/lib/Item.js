class Item {
  constructor(attributes) {
    this._attributes = attributes;
  }

  attributes() {
    return this._attributes;
  }

  ref() {
    return this._attributes.ref;
  }

  id() {
    return this._attributes.id;
  }

  row() {
    return this._attributes.row;
  }

  index() {
    return this._attributes.index;
  }

  layout() {
    return this._attributes.layout;
  }

  columnId() {
    return this._attributes.columnId;
  }

  isVisible() {
    return this._attributes.visible;
  }

  isHidden() {
    return this._attributes.hidden;
  }

  isLocked() {
    return this._attributes.locked;
  }

  setHidden(hidden) {
    this._attributes.hidden = hidden;
  }

  setRef(ref) {
    this._attributes.ref = ref;
  }

  setLayout(layout) {
    this._attributes.layout = layout;
  }

  setVisible(visible) {
    this._attributes.visible = visible;
  }

  setColumnId(columnId) {
    this._attributes.columnId = columnId;
  }

  setIndex(index) {
    this._attributes.index = index;
  }

  measureAndSaveLayout(previousItem) {
    const ref = this.ref();
    ref && ref.measure && ref.measure((fx, fy, width, height, px, py) => {
      const layout = { x: px, y: py, width: width, height: height };
      this.setLayout(layout);
      if (!this.isVisible() && layout.x && layout.y && layout.width && layout.height) {
        this.setVisible(true);
      } else if (this.isVisible() && !layout.x && !layout.y && !layout.width && !layout.height) {
        this.setVisible(false);
      }
      if (this.isLocked()) {
        this.setVisible(false);
      }
      if (previousItem && previousItem.layout().y > layout.y) {
        this.setVisible(false);
      }
    });
  }
}

export default Item;
