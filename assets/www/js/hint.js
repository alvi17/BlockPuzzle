
var HintType = {
  None: 'None',
  RowsMustBeUnique: 'কোনো দুইটি রো একই হতে পারবে না।',
  ColsMustBeUnique: 'কোনো দুইটি কলাম একই হতে পারবে না।',
  RowMustBeBalanced: 'প্রতিটি রো তে সমান সংখ্যক একই কালারের ব্লক থাকবে। ',
  ColMustBeBalanced: 'প্রতিটি কলামে সমান সংখ্যক একই কালারের ব্লক থাকবে।',
  MaxTwoRed: 'তিনটি লাল ব্লক পাশাপাশি থাকতে পারবে না।',
  MaxTwoBlue: 'তিনটি নীল ব্লক পাশাপাশি থাকতে পারবে না।',
  SinglePossibleRowCombo: 'শুধুমাত্র  একটে কম্বিনেশ্ন সম্ভব।',
  SinglePossibleColCombo: 'শুধুমাত্র  একটে কম্বিনেশ্ন সম্ভব।',
  Error: 'কিছু একটা ভুল হয়েছে।',
  Errors: 'কিছু কিছু ভুল হয়েছে।'
};

function Hint(grid) {
  var self = this,
      active = false,
      visible = false,
      info = {
        type: HintType.None,
        tile: null,
        tile2: null,
        doubleRowOrCol: []
      }

  this.doubleColFound = [];
  this.doubleRowFound = [];

  function clear() {
    this.doubleColFound = [];
    this.doubleRowFound = [];
    hide();
    if (grid)
      grid.unmark();
    active = false;
    info = {
      type: HintType.None,
      tile: null,
      tile2: null,
      doubleRowOrCol: []
    }
  }

  function mark(tile, hintType, tile2, doubleRowOrCol) {
    if (active) {
      info.tile = tile;
      info.tile2 = tile2 || null;
      info.type = hintType;
      info.doubleRowOrCol = doubleRowOrCol;
      return true;
    }
    return false;
  }

  function next() {
    var wrongTiles = grid.wrongTiles;
    if (wrongTiles.length) {
      //if (grid.emptyTileCount == 0) {
        // if there are errors on a full grid, show a better message than this...
        var handled = getErrorHintForCompleteGrid();
        if (handled)
          return;

      //}

      if (wrongTiles.length == 1) {
        wrongTiles[0].mark();
        show(HintType.Error);
      } else {
        $(wrongTiles).each(function(){
          this.mark();
        })
        show(HintType.Errors);
      }
      return;
    }
    active = true;
    grid.solve(false, true);
    if (info.tile) {
      show(info.type);      
      switch (info.type) {
        case HintType.RowMustBeBalanced:
          grid.markRow(info.tile.y);
          break;
        case HintType.ColMustBeBalanced:
          grid.markCol(info.tile.x);
          break;
        case HintType.RowsMustBeUnique:
          grid.markRow(info.tile.y);
          grid.markRow(info.doubleRowOrCol[0] != info.tile.y ? info.doubleRowOrCol[0] : info.doubleRowOrCol[1]);
          break;
        case HintType.ColsMustBeUnique:
          grid.markCol(info.tile.x);
          grid.markCol(info.doubleRowOrCol[0] != info.tile.x ? info.doubleRowOrCol[0] : info.doubleRowOrCol[1]);
          break;
        default:
          if (info.tile2)
            info.tile2.mark();
          info.tile.mark();
          break;
      }
    }
  }

  function getErrorHintForCompleteGrid() {
    active = true;
    var invalidStates = [],
        notUniqueStates = [];
    
    grid.isValid(true);
    for (var i=0; i<grid.width; i++) {
      var ci = grid.getColInfo(i),
          ri = grid.getRowInfo(i);
      if (ci.isFull && ci.isInvalid) invalidStates.push(ci);
      if (ri.isFull && ri.isInvalid) invalidStates.push(ri);
      if (ci.isFull && !ci.unique) notUniqueStates.push(ci);
      if (ri.isFull && !ri.unique) notUniqueStates.push(ri);
    }
    var item = null;
    if (invalidStates.length)
      item = Utils.pick(invalidStates);
    else if (notUniqueStates.length)
      item = Utils.pick(notUniqueStates);

    if (item) {
      var index = -1, // col or row to highlight
          index2 = -1, // col or row to highlight
          isCol = (item.col === 0 || item.col)? true : false;
          hintType = null;
      index = isCol? item.col : item.row;
      if (item.hasTriple)
        hintType = item.hasTripleRed? HintType.MaxTwoRed : HintType.MaxTwoBlue;
      else if (item.nr2s > item.nr1s || item.nr1s > item.nr2s)
        hintType = isCol? HintType.ColMustBeBalanced : HintType.RowMustBeBalanced;
      else if (item.nr1s > item.nr2s)
        hintType = isCol? HintType.ColMustBeBalanced : HintType.RowMustBeBalanced;
      else if (!item.unique) {
        hintType = isCol? HintType.ColsMustBeUnique : HintType.RowsMustBeUnique;
        if (item.similar == 0 || item.similar)
          index2 = item.similar;
      }

      if (index == 0 || index) {

        // set the hint
        if (isCol) {
          grid.markCol(index);
          if (index2 == 0 || index2)
            grid.markCol(index2);
        }
        else {
          grid.markRow(index);
          if (index2 == 0 || index2)
            grid.markRow(index2);
        }
        show(hintType);
        return true;
      }
    }
    return false;
  }

  function show(type) {
    var s = type;
    $('#hintMsg').html('<span>' + s + '</span>');
    $('html').addClass('showHint');
    visible = true;
  }

  function hide() {
    $('html').removeClass('showHint');
    visible = false;
  }

  this.clear = clear;
  this.mark = mark;
  this.next = next;
  this.show = show;
  this.hide = hide;
  this.getErrorHintForCompleteGrid = getErrorHintForCompleteGrid;
  
  this.info = info;
  this.__defineGetter__('active', function() { return active; })
  this.__defineSetter__('active', function(v) { active = v; })
  this.__defineGetter__('visible', function() { return visible; })
};