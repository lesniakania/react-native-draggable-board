import React from 'react';
import _ from 'underscore';
import ReactTimeout from 'react-timeout'

import {
  View,
  TouchableWithoutFeedback,
  PanResponder,
  Animated,
  ListView,
  ScrollView,
  Text
} from 'react-native';

class Board extends React.Component {
  MAX_RANGE = 100
  MAX_DEG = 30
  MOVE_INTERVAL = 5

  constructor(props) {
    super(props);

    this.verticalOffset = 0;

    this.state = {
      rotate: new Animated.Value(0),
      startingX: 0,
      startingY: 0,
      x: 0,
      y: 0,
      movingMode: false,
    };

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => this.state.movingMode,
      onMoveShouldSetPanResponder: () => this.state.movingMode,
      onPanResponderTerminationRequest: () => !this.state.movingMode,
      onPanResponderMove: this.onPanResponderMove.bind(this),
      onPanResponderRelease: this.onPanResponderRelease.bind(this),
      onPanResponderTerminate: this.onPanResponderRelease.bind(this)
    })
  }

  componentWillUnmount() {
    this.unsubscribeFromMovingMode();
  }

  onPanResponderMove(event, gesture, callback) {
    console.log('MOVE!!')
    const leftTopCornerX = this.state.startingX + gesture.dx;
    const leftTopCornerY = this.state.startingY + gesture.dy;
    if (this.state.movingMode) {
      const draggedItem = this.state.draggedItem;
      this.x = event.nativeEvent.pageX;
      this.y = event.nativeEvent.pageY;
      const columnAtPosition = this.props.rowRepository.move(draggedItem, this.x, this.y);
      console.log(['MOVE', columnAtPosition && columnAtPosition.id()]);
      if (columnAtPosition) {
        //let { scrolling, offset } = this.props.rowRepository.scrollingPosition(columnAtPosition, this.x, this.y);
        //if (scrolling) {
          //this.scroll(columnAtPosition, draggedItem, offset);
        //}
      }

      this.setState({
        x: leftTopCornerX,
        y: leftTopCornerY
      });
    }
  }

  onScrollingStarted() {
    this.scrolling = true;
  }

  onScrollingEnded() {
    this.scrolling = false;
  }

  isScrolling() {
    return this.scrolling;
  }

  scroll(column, draggedItem, anOffset) {
    console.log('SCROLLING!')
    if (!this.isScrolling()) {
      this.onScrollingStarted();
      const scrollOffset = column.scrollOffset() + 50 * anOffset;
      this.props.rowRepository.setScrollOffset(column.id(), scrollOffset);

      console.log(['SCROLL OFFSET', scrollOffset, column.id()])
      column.listView().scrollTo({ y: scrollOffset });
    }

    this.props.rowRepository.move(draggedItem, this.x, this.y);
    let { scrolling, offset } = this.props.rowRepository.scrollingPosition(column, this.x, this.y);
    if (scrolling) {
      this.props.setTimeout(() => {
        this.scroll(column, draggedItem, offset);
      }, 1000);
    }
  }

  endMoving() {
    console.log('END MOVING')
    this.setState({ movingMode: false });
    const { srcColumnId, draggedItem } = this.state;
    const { rowRepository, onDragEnd } = this.props;
    rowRepository.show(draggedItem.columnId(), draggedItem);
    rowRepository.notify(draggedItem.columnId(), 'reload');

    const destColumnId = draggedItem.columnId();
    onDragEnd && onDragEnd(srcColumnId, destColumnId, draggedItem);
  }

  onPanResponderRelease(e, gesture) {
    console.log('RELEASE')
    this.x = null;
    this.y = null;
    if (this.state.movingMode) {
      this.rotateBack();
      this.props.setTimeout(this.endMoving.bind(this), 1000);
    } else if (this.isScrolling()) {
      this.unsubscribeFromMovingMode();
    }
  }

  rotateTo(value) {
    Animated.spring(
      this.state.rotate,
      {
        toValue: value,
        duration: 5000
      }
    ).start();
  }

  rotate() {
    this.rotateTo(this.MAX_DEG);
  }

  rotateBack() {
    this.rotateTo(0);
  }

  open(row) {
    this.unsubscribeFromMovingMode();
    this.props.open(row);
  }

  unsubscribeFromMovingMode() {
    this.props.clearTimeout(this.movingSubscription);
  }

  onPressIn(columnId, item, columnCallback) {
    return () => {
      this.movingSubscription = this.props.setTimeout(() => {
        const { x, y } = item.layout();
        this.props.rowRepository.hide(columnId, item);
        this.setState({
          movingMode: true,
          draggedItem: item,
          srcColumnId: item.columnId(),
          startingX: x,
          startingY: y,
          x: x,
          y: y,
        });
        columnCallback();
        this.rotate();
        console.log(['ON PRESS IN', this.props.rowRepository.visibleItems(columnId).map((item) => [item.index(), item.row().title, item.layout()])])
        this.unsubscribeFromMovingMode();
      }, 2000);
    }
  }

  onPress(item) {
    return () => {
      if (!this.state.movingMode) {
        this.open(item.row());
      } else {
        this.endMoving();
      }
    }
  }

  onScrollEnd(event) {
    this.props.rowRepository.updateColumnsLayoutAfterVisibilityChanged();
    this.verticalOffset = event.nativeEvent.contentOffset.x;
  }

  movingStyle() {
    var interpolatedRotateAnimation = this.state.rotate.interpolate({
      inputRange: [-this.MAX_RANGE, 0, this.MAX_RANGE],
      outputRange: [`-${this.MAX_DEG}deg`, '0deg', `${this.MAX_DEG}deg`]
    });
    return Object.assign({}, {
      transform: [{rotate: interpolatedRotateAnimation}],
      position: 'absolute',
      zIndex: 10,
      top: this.state.y,
      left: this.verticalOffset + this.state.x
    });
  }

  movingTask() {
    const { draggedItem } = this.state;
    const data = { item: draggedItem, style: this.movingStyle() };
    return this.renderWrapperRow(data);
  }

  renderWrapperRow(data) {
    const { renderRow } = this.props;
    return (
      <TaskWrapper {...data}>
        {renderRow && renderRow(data.item.row())}
      </TaskWrapper>
    );
  }

  render() {
    const columns = this.props.rowRepository.columns();
    const columnWrappers = columns.map((column) => {
      const columnComponent = (
        <Column
          column={column}
          movingMode={this.state.movingMode}
          rowRepository={this.props.rowRepository}
          onPressIn={this.onPressIn.bind(this)}
          onPress={this.onPress.bind(this)}
          onPanResponderMove={this.onPanResponderMove.bind(this)}
          onPanResponderRelease={this.onPanResponderRelease.bind(this)}
          renderWrapperRow={this.renderWrapperRow.bind(this)}
          onScrollingStarted={this.onScrollingStarted.bind(this)}
          onScrollingEnded={this.onScrollingEnded.bind(this)}
          unsubscribeFromMovingMode={this.unsubscribeFromMovingMode.bind(this)}
        />
      );
      return this.props.renderColumnWrapper(column.data(), column.index(), columnComponent);
    });

    // TODO: fix stop moving (because of no item behaviour)
    // TODO: release when stop dragging
    // TODO: handle when you don't wait while pressing
    // TODO: threshold when tasks are different size
    // Don't scroll if nothing to scroll...

    return (
      <ScrollView
        style={this.props.style}
        scrollEnabled={!this.state.movingMode}
        onScrollEndDrag={this.onScrollEnd.bind(this)}
        onMomentumScrollEnd={this.onScrollEnd.bind(this)}
        horizontal={true}
        {...this.panResponder.panHandlers}
      >
        {this.state.movingMode && this.movingTask()}
        {columnWrappers}
      </ScrollView>
    )
  }
}

Board = ReactTimeout(Board);

class Column extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dataSource: this.dataSourceWithItems([])
    };
  }

  componentWillMount() {
    this.props.rowRepository.addListener(this.props.column.id(), 'reload', this.reload.bind(this));
  }

  reload() {
    this.setState({ dataSource: this.dataSource() });
  }

  rowHasChanged(item1, item2) {
    return item1.row.id !== item2.row.id;
  }

  dataSourceWithItems(items) {
    const ds = new ListView.DataSource({ rowHasChanged: this.rowHasChanged });
    return ds.cloneWithRows(items);
  }

  dataSource() {
    let items = this.props.rowRepository.items(this.props.column.id());
    return this.dataSourceWithItems(items);
  }

  onPressIn(item) {
    let callback = () => {
      this.reload();
    };
    return this.props.onPressIn(this.props.column.id(), item, callback);
  }

  onPress(item) {
    return this.props.onPress(item);
  }

  setItemRef(item, ref) {
    this.props.rowRepository.setItemRef(this.props.column.id(), item, ref);
  }

  updateItemWithLayout(item) {
    return () => {
      this.props.rowRepository.updateItemWithLayout(this.props.column.id(), item);
    }
  }

  setColumnRef(ref) {
    this.props.rowRepository.setColumnRef(this.props.column.id(), ref);
  }

  updateColumnWithLayout() {
    this.props.rowRepository.updateColumnWithLayout(this.props.column.id());
  }

  renderWrapperRow(item) {
    let props = {
      onPressIn: this.onPressIn(item),
      onPress: this.onPress(item),
      hidden: item.isHidden(),
      item: item
    };
    return (
      <View ref={(ref) => this.setItemRef(item, ref)} onLayout={this.updateItemWithLayout(item)}>
        {this.props.renderWrapperRow(props)}
      </View>
    );
  }

  handleScroll(event) {
    console.log(['HANDLE SCROLL', event.nativeEvent])
    // Needed if simple scroll started, without moving mode

    this.props.unsubscribeFromMovingMode();
    this.props.onScrollingStarted();
  }

  endScrolling(event) {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const column = this.props.rowRepository.column(this.props.column.id());
    if (currentOffset >= column.scrollOffset) {
      this.props.onScrollingEnded();
    }
  }

  onScrollEndDrag(event) {
    console.log(['SCROLL DRAG ENDED', event.nativeEvent])
    this.endScrolling(event);
  }

  onMomentumScrollEnd(event) {
    console.log(['SCROLL ENDED', event.nativeEvent])
    this.endScrolling(event);
  }

  handleChangeVisibleItems(visibleItems) {
    console.log(['VISIBILITY CHANGED', this.props.column.id()])
    this.props.rowRepository.updateItemsVisibility(this.props.column.id(), visibleItems);
  }

  setListView(ref) {
    this.props.rowRepository.setListView(this.props.column.id(), ref);
  }

  render() {
    return (
      <View
        style={{ flex: 1 }}
        ref={this.setColumnRef.bind(this)}
        onLayout={this.updateColumnWithLayout.bind(this)}>
        <ListView
          dataSource={this.dataSource()}
          ref={this.setListView.bind(this)}
          onScroll={this.handleScroll.bind(this)}
          onMomentumScrollEnd={this.onMomentumScrollEnd.bind(this)}
          onScrollEndDrag={this.onScrollEndDrag.bind(this)}
          onChangeVisibleRows={this.handleChangeVisibleItems.bind(this)}
          renderRow={this.renderWrapperRow.bind(this)}
          scrollEnabled={!this.props.movingMode}
          enableEmptySections={true}
         />
      </View>
    );
  }
};

Column = ReactTimeout(Column);

class TaskWrapper extends React.Component {
  render() {
    let style = [this.props.style];
    const { item, hidden } = this.props;

    if (hidden) {
      style.push({ opacity: 0 });
    }

    return (
      <TouchableWithoutFeedback
        onPressIn={this.props.onPressIn}
        onPress={this.props.onPress}
      >
        <Animated.View style={style}>
          {this.props.children}
        </Animated.View>
      </TouchableWithoutFeedback>
    )
  }
};

export default Board;
