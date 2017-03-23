import _ from 'underscore';
import Item from './Item.js';

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

  data() {
    return this._attributes.data;
  }

  items() {
    let items = _(this._attributes.items).values();
    // fake task is added as last because of the bug:
    // https://github.com/facebook/react-native/issues/12014
    const fake = new Item({
      id: -2,
      index: 100000,
      columnId: this.id(),
      row: { id: -2 },
      hidden: true,
      locked: true,
      visible: false
    });
    return _(items).sortBy((item) => item.index()).concat([fake]);
  }

  visibleItems(columnId) {
    return _(this.items(columnId)).filter((item) => item.isVisible());
  }

  scrollOffset() {
    return this._attributes.scrollOffset;
  }

  contentHeight() {
    return this._attributes.contentHeight;
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

  setContentHeight(contentHeight) {
    this._attributes.contentHeight = contentHeight;
  }

  setRef(ref) {
    this._attributes.ref = ref;
  }

  setLayout(layout) {
    this._attributes.layout = layout;
  }

  measureAndSaveLayout() {
    const ref = this.ref();
    ref && ref.measure((fx, fy, width, height, px, py) => {
      const layout = { x: px, y: py, width: width, height: height };
      this.setLayout(layout);
    });
  }

  setItem(item) {
    this._attributes.items[item.id()] = item;
    item.setColumnId(this.id());
  }

  removeItem(item) {
    this._attributes.items = _(this._attributes.items).omit(item.id());
  }

  updateLastItemVisibility() {
    const visibleItems = this.visibleItems();
    const items = this.items();
    // + 1 is for the fake one
    if (visibleItems.length + 1 < items.length) {
      visibleItems[visibleItems.length - 1].setVisible(false);
    }
  }
};

export default ColumnItem;
