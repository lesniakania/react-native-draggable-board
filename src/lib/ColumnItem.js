import _ from 'underscore';

class ColumnItem {
  constructor(attributes) {
    this._attributes = attributes;
  }

  attributes() {
    return this._attributes;
  }

  item(itemId) {
    return this._attributes.items[itemId];
  }

  existingItemAttributes() {
    const item = this.item(item.id)
    return item && item.attributes();
  }

  data() {
    return this._attributes.data;
  }

  items() {
    let items = _(this._attributes.items).values();
    return _(items).sortBy((item) => item.index());
  }

  visibleItems(columnId) {
    return _(this.items(columnId)).filter((item) => item.isVisible());
  }

  scrollOffset() {
    return this._attributes.scrollOffset;
  }

  id() {
    return this._attributes.id;
  }

  ref() {
    return this._attributes.ref;
  }

  index() {
    return this._attributes.index;
  }

  layout() {
    return this._attributes.layout;
  }

  listView() {
    return this._attributes.listView;
  }

  setListView(listView) {
    this._attributes.listView = listView;
  }

  setScrollOffset(scrollOffset) {
    this._attributes.scrollOffset = scrollOffset;
  }

  setRef(ref) {
    this._attributes.ref = ref;
  }

  setLayout(layout) {
    this._attributes.layout = layout;
  }

  measureAndSaveLayout() {
    this.ref().measure((fx, fy, width, height, px, py) => {
      const layout = { x: px, y: py, width: width, height: height };
      this.setLayout(layout);
    });
  }

  setItem(item) {
    this._attributes.items[item.id] = item;
    item.setColumnId(this.id());
  }

  removeItem(item) {
    this._attributes.items = _(this._attributes.items).omit(item.id());
  }
};

export default ColumnItem;
