# React Native Draggable Board

Scrollable board component with sortable columns and draggable rows.

**Disclaimer**: this is under development. Use at your own risk, see
[issues](https://github.com/lesniakania/react-native-draggable-board/issues).

![Drag and drop demo](https://github.com/lesniakania/react-native-draggable-board/raw/master/drag-and-drop-demo.gif) ![Drag and scroll demo](https://github.com/lesniakania/react-native-draggable-board/raw/master/drag-and-scroll-demo.gif)

# Usage

Install library via `npm`

`npm install react-native-draggable-board`

First you need to build `RowRepository` with data:

```js
const data = [
  {
    id: 1,
    name: 'Column1',
    rows: [
      { id: 1, name: 'Item1' },
      { id: 2, name: 'Item2' },
      { id: 3, name: 'Item3' },
      { id: 4, name: 'Item4' },
      { id: 5, name: 'Item5' },
      { id: 6, name: 'Item6' },
      { id: 7, name: 'Item7' },
      { id: 8, name: 'Item8' }
    ]
  },
  {
    id: 2,
    name: 'Column2',
    rows: [
      { id: 9, name: 'Item9' },
      { id: 10, name: 'Item10' }
    ]
  }
];
const rowRepository = new RowRepository(data);
```

If you need to fetch data asynchronously, you can initialize empty
repository and update it with data later:

```js
const rowRepository = new RowRepository(data);
rowRepository.updateData(data);
```

Then you can render the `Board`:

```jsx
  <Board
    style={styles.board}
    rowRepository={this.state.rowRepository}
    renderRow={this.renderRow.bind(this)}
    renderColumnWrapper={this.renderColumnWrapper.bind(this)}
    open={this.onOpen.bind(this)}
    onDragEnd={this.onDragEnd.bind(this)}
  />
```

| Property | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| rowRepository | `RowRepository` | yes | object that holds data |
| renderRow | `function` | yes | function responsible for rendering row item |
| renderColumnWrapper | `function` | no | function responsible for rendering wrapper of the column if needed |
| open | `function` | no | function invoked when item pressed |
| onDragEnd | `function` | no | function invoked when drag is finished |
| style | `object` | no | styles for the internal `ScrollView`|
| contentContainerStyle | `object` | no | contentContainerStyle for the internal `ScrollView` |


# Example

See [ReactNativeDraggableBoardExample](https://github.com/lesniakania/ReactNativeDraggableBoardExample) for more details.

# Supported platforms

Both iOS and Android are supported.

# Issues

Check [issues tab](https://github.com/lesniakania/react-native-draggable-board/issues)

# Licence

ISC License

Copyright (c) 2016, Anna Slimak

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

