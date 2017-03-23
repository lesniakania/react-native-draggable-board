import _ from 'underscore';

class Mover {
  constructor(positionCalculator) {
    this.positionCalculator = positionCalculator;
  }

  move(rowRepository, registry, draggedItem, x, y) {
    const fromColumnId = draggedItem.columnId();
    const columns = rowRepository.columns();
    const columnAtPosition = this.positionCalculator.columnAtPosition(columns, x, y);
    if (!columnAtPosition) {
      return;
    }

    const toColumnId = columnAtPosition.id();
    if (toColumnId != fromColumnId) {
      this.moveToOtherColumn(rowRepository, registry, fromColumnId, toColumnId, draggedItem);
    }

    let items = rowRepository.visibleItems(toColumnId);
    const itemAtPosition = this.positionCalculator.itemAtPosition(items, toColumnId, x, y, draggedItem);
    if (!itemAtPosition) {
      return columnAtPosition;
    }

    const draggedId = draggedItem.id();
    const itemAtPositionId = itemAtPosition.id();

    if (draggedItem.id() == itemAtPosition.id()) {
      return columnAtPosition;
    }

    this.switchItemsBetween(rowRepository, draggedItem, itemAtPosition, toColumnId);

    return columnAtPosition;
  }

  moveToOtherColumn(rowRepository, registry, fromColumnId, toColumnId, item) {
    const fromItems = rowRepository.items(fromColumnId);
    // -2 is because last task is fake task added because of the bug:
    // https://github.com/facebook/react-native/issues/12014
    for (const i of _.range(fromItems.length - 2, item.index(), -1)) {
      let fromItem = fromItems[i];
      fromItem.setIndex(fromItem.index() - 1);
      const newX = fromItems[i - 1].layout().x;
      const newY = fromItems[i - 1].layout().y;
      fromItem.setLayout(Object.assign(fromItem.layout(), { x: newX, y: newY }));
    }
    registry.move(fromColumnId, toColumnId, item);
    rowRepository.notify(fromColumnId, 'reload');

    item.setVisible(true);
    item.setIndex(-1);
    const items = rowRepository.items(toColumnId);
    for (const item of items) {
      item.setIndex(item.index() + 1);
    }

    const visibleItems = rowRepository.visibleItems(toColumnId);
    for (const i of _.range(0, visibleItems.length - 1)) {
      visibleItems[i].setLayout(Object.assign({}, visibleItems[i + 1].layout()));
    }
    const lastItem = visibleItems[visibleItems.length - 1];
    const lastLayout = lastItem.layout();
    const newLastY = lastLayout.y + lastLayout.height;
    lastItem.setLayout(Object.assign(lastLayout, { y: newLastY }));

    const column = registry.column(toColumnId);
    column.updateLastItemVisibility();
  }

  switchItemsBetween(rowRepository, draggedItem, itemAtPosition, toColumnId) {
    draggedItem.setVisible(true);

    let items = rowRepository.visibleItems(toColumnId);
    const draggedItemI = _(items).findIndex((item) => item.id() == draggedItem.id());
    const itemAtPositionI = _(items).findIndex((item) => item.id() == itemAtPosition.id());
    let range;
    if (draggedItem.index() < itemAtPosition.index()) {
      range = _.range(draggedItemI, itemAtPositionI);
    } else {
      range = _.range(itemAtPositionI, draggedItemI);
    }

    for (const i of range) {
      const firstItem = items[i];
      const secondItem = items[i + 1];
      this.switchItems(toColumnId, firstItem, secondItem);
      items = rowRepository.visibleItems(toColumnId);
    }

    rowRepository.notify(toColumnId, 'reload');
  }

  switchItems(columnId, firstItem, secondItem) {
    if (!firstItem || !secondItem) {
      return;
    }

    let firstId = firstItem.id();
    let secondId = secondItem.id();
    let firstIndex = firstItem.index();
    let secondIndex = secondItem.index();
    let firstY = firstItem.layout().y;
    let secondHeight = secondItem.layout().height;
    let firstRef = firstItem.ref();
    let secondRef = secondItem.ref();

    firstItem.setIndex(secondIndex);
    secondItem.setIndex(firstIndex);

    firstItem.setLayout(Object.assign(firstItem.layout(), { y: firstY + secondHeight }));
    secondItem.setLayout(Object.assign(secondItem.layout(), { y: firstY }));

    firstItem.setRef(secondRef);
    secondItem.setRef(firstRef);
  }
};

export default Mover;
