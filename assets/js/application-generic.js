/*
# BillGastro -- The innovative Point Of Sales Software for your Restaurant
# Copyright (C) 2012-2013  Red (E) Tools LTD
# 
# See license.txt for the license applying to all files within this software.
*/
var tableupdates = -1;
var automatic_printing = false;
var debugmessages = [];
var _CTRL_DOWN = false;
var _key_codes = {tab: 9,shift: 16, ctrl: 17, alt: 18, f2: 113};
var _keys_down = {tab: false,shift: false, ctrl: false, alt: false, f2: false};
$(function(){
  jQuery.ajaxSetup({
      'beforeSend': function(xhr) {
          //xhr.setRequestHeader("Accept", "text/javascript");
          xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'));
      }
  })

  if (typeof(automatic_printing_timeout) == 'undefined') {
    automatic_printing_timeout = window.setInterval(function() {
      if ( automatic_printing == true ) { window.location.href = '/items.bill'; }
    }, 10000);
  }
  $(window).keydown(function(e){
    for (var key in _key_codes) {
      if (e.keyCode == _key_codes[key]) {
        _keys_down[key] = true;
      }
    }
  });
  $(window).keyup(function(e){
    for (var key in _key_codes) {
      if (e.keyCode == _key_codes[key]) {
        _keys_down[key] = false;
      }
    }
  });
})
/*
 *  Allows us to latch onto events in the UI for adding menu items, i.e. in this case, customers, but later more.
 */
function emit(msg,packet) {
  $('body').triggerHandler({type: msg, packet:packet});
}

function connect(unique_name,msg,fun) {
  var pcd = _get('plugin_callbacks_done');
  if (!pcd)
    pcd = [];
  if (pcd.indexOf(unique_name) == -1) {
    $('body').on(msg,fun);
    pcd.push(unique_name);
  }
  _set('plugin_callbacks_done',pcd)
}
function _get(name,context) {
  if (context) {
    // if you pass in a 3rd argument, which should be an html element, then that is set as teh context.
    // this ensures garbage collection of the values when that element is removed.
    return $.data(context[0],name);
  } else {
    return $.data(document.body,name);
  }
}
function _set(name,value,context) {
  if (context) {
    // if you pass in a 3rd argument, which should be an html element, then that is set as teh context.
    // this ensures garbage collection of the values when that element is removed.
    return $.data(context[0],name,value);
  } else {
    return $.data(document.body,name,value);
  } 
}
function scroll_to(element, speed) {
  target_y = $(window).scrollTop();
  current_y = $(element).offset().top;
  if (settings.workstation) {
    do_scroll((current_y - target_y)*1.05, speed);
  } else {
    window.scrollTo(0, current_y);
  }
}

function scroll_for(distance, speed) {
  do_scroll(distance, speed);
}

function  in_array_of_hashes(array,key,value) {
  for (var i in array) {
    if (array[i][key]) {
      try {
        if (array[i][key] == value) {
          return true;
        } else if (array[i][key].indexOf(value) != -1){
          return true;
        }
      } catch (e) {
        return false;
      }
    }
  }
  return false;
}

function do_scroll(diff, speed) {
  window.scrollBy(0,diff/speed);
  newdiff = (speed-1)*diff/speed;
  scrollAnimation = setTimeout(function(){ do_scroll(newdiff, speed) }, 20);
  if(Math.abs(diff) < 5) { clearTimeout(scrollAnimation); }
}

function debug(message) {
  if ( debugmessages.length > 7 ) { debugmessages.shift(); }
  debugmessages.push(message);
  $('#messages').html(debugmessages.join('<br />'));
}


function toggle_all_option_checkboxes(source) {
  if ($(source).attr('checked') == 'checked') {
    $('input.category_checkbox:checkbox').attr('checked',true);
  } else {
    $('input.category_checkbox:checkbox').attr('checked',false);
  }
}

function date_as_ymd(date) {
  return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
}
function get_date(str) {
  return new Date(Date.parse(str));
}
/*
  _fetch is a quick way to fetch a result from the server.
 */
function _fetch(url,callback) {
  $.ajax({
    url: url,
    context: window,
    success: callback
  });
}
/*
 *  _push is a quick way to deliver an object to the server
 *  It takes a data object, a string url, and a success callback.
 *  Additionally, you can pass, after those three an error callback,
 *  and an object of options to override the options used with
 *  the ajax request.
 */
function _push(object) {
  var payload = null;
  var callback = null;
  var error_callback = function (jqXHR,status,err) {
    console.log(jqXHR,status,err.get_message());
  };
  var user_options = {};
  var url;
  for (var i = 0; i < arguments.length; i++) {
    switch(typeof arguments[i]) {
      case 'object':
        if (!payload) {
          payload = {currentview: 'push', model: {}, api_key: retail.config.api_key}
          $.each(arguments[i], function (key,value) {
            console.log(key,value);
            payload[key] = value;
          });
        } else {
          user_options = arguments[i];
        }
        break;
      case 'function':
        if (!callback) {
          callback = arguments[i];
        } else {
          error_callback = arguments[i];
        }
        break;
      case 'string':
        url = arguments[i];
        break;
    }
  }
  options = { 
    context: window,
    url: url, 
    type: 'post', 
    data: payload, 
    timeout: 20000, 
    success: callback, 
    error: error_callback
  };
  if (typeof user_options == 'object') {
    $.each(user_options, function (key,value) {
      options[key] = value;
    });
  }
  $.ajax(options);
}
function create_dom_element (tag,attrs,content,append_to) {
  element = $(document.createElement(tag));
  $.each(attrs, function (k,v) {
    element.attr(k, v);
  });
  element.html(content);
  if (append_to != '')
    $(append_to).append(element);
  return element;
}

/*
  Call this function on an input that you want to have auto complete functionality.
  requires a jquery element, a dictionary (array, or object, or hash mapping)
  options, which is an object where the only required key is the field if you use an object, or hash mapping, then a callback,
  which is what function to run when someone clicks a search result.
  
  On an input try:
  
  auto_completable($('#my_input'),['abc yay','123 ghey'],{},function (result) {
      alert('You chose ' + result);
  });
  in the callback, $(this) == $('#my_input')
 */
function auto_completable(element,dictionary,options,callback) {
  var key = 'auto_completable.' + element.attr('id');
  element.attr('auto_completable_key',key);
  _set(key + ".dictionary",dictionary,element); // i.e. we set the context of the variable to the element so that it will be gc'ed
  _set(key + ".options", options,element);
  _set(key + ".callback", callback,element);
  element.on('keyup',function () {
    var val = $(this).val();
    var key = $(this).attr('auto_completable_key');
    var results = [];
    if (val.length > 2) {
      var options = _get(key + '.options',$(this));
      var dictionary = _get(key + ".dictionary",$(this));
      if (options.map) { 
        // We are using a hash map, where terms are organized by first letter, then first two letters
        var c = val.substr(0,1).toLowerCase();
        var c2 = val.substr(0,2).toLowerCase();
        // i.e. if the search term is doe, the check to see if dictionary['d'] is set
        if (dictionary[c]) {
          // i.e. if the search term is doe, the check to see if dictionary['do'] is set
          if (dictionary[c][c2]) {
            // i.e. we consider dictionary['do'] to be an array of objects
            for (var i in dictionary[c][c2]) {
              // we assume that you have set options { field: "name"} or some such
              if (dictionary[c][c2][i][options.field].toLowerCase().indexOf(val.toLowerCase()) != -1) {
                results.push(dictionary[c][c2][i]);
              }
            }
          }
        }
      } else { // We assume that it's just an array of possible values
        for (var i = 0; i < dictionary.length; i++) {
          if (options.field) {
            if (dictionary[i][options.field].indexOf(val.toLowerCase()) != -1) {
              results.push(dictionary[i])
            } 
          } else {
            if (dictionary[i].indexOf(val.toLowerCase()) != -1) {
              results.push(dictionary[i])
            } 
          }
        }
      }
    }
    auto_completable_show_results($(this),results);
  });
}
function auto_completable_show_results(elem,results) {
  $('#auto_completable').remove();
  if (results.length > 0) {
    var key = elem.attr('auto_completable_key');
    var options = _get(key + '.options',elem);
    ac = create_dom_element('div',{id: 'auto_completable'},'',$('body'));
    var offset = elem.offset();
    var css = {left: offset.left, top: offset.top + elem.outerHeight(), width: elem.outerWidth() + ($.support.boxModel ? 0 : 2)};
    ac.css(css);
    for (var i in results) {
      var result = results[i];
      var div = create_dom_element('div',{'class': 'result'},result[options.field],ac);
      // i.e. we set up the vars we will need on the callback on the element in context
      _set('auto_completable.result',result,div);
      _set('auto_completable.target',elem,div);
      div.on('click', function () {
        var target = _get('auto_completable.target',$(this));
        var result = _get('auto_completable.result',$(this));
        var key = target.attr('auto_completable_key');
        var callback = _get(key + ".callback",target);
        callback.call(target,result,$(this)); //i.e. the callback will be executed with the input as this, the result is the first argument
        // the last optional argument will be the origin of the event, i.e. the div
        $('#auto_completable').remove();
      });
    }
  }
}

function days_between_dates(from, to) {
  var days = Math.floor((Date.parse(to) - Date.parse(from)) / 86400000);
  if (days == 0)
    days = 0
  return days;
}
function _log(arg1,arg2,arg3) {
 console.log(arg1,arg2,arg3);
}
/* Adds a delete/X button to the element. Type options  are right and append. The default callback simply slides the element up.
 if you want special behavior on click, you can pass a closure.*/
function deletable(elem,type,callback) {
  if (typeof type == 'function') {
    callback = type;
    type = 'right'
  }
  if (!type)
    type = 'right';
  if ($('#' + elem.attr('id') + '_delete').length == 0) {
    var del_button = create_dom_element('div',{id: elem.attr('id') + '_delete', 'class':'delete', 'target': elem.attr('id')},'',elem);
    if (!callback) {
      del_button.on('click',function () {
        $('#' + $(this).attr('target')).slideUp();
      });
    } else {
      del_button.on('click',callback);
    }
  } else {
    var del_button = $('#' + elem.attr('id') + '_delete');
    if (callback) {
      del_button.unbind('click').on('click',callback);
    }
  }
  var offset = elem.offset();
  if (type == 'right') {
    offset.left += elem.outerWidth() - del_button.outerWidth() - 5;
    offset.top += 5
    del_button.offset(offset);
  } else if (type == 'append') {
    elem.append(del_button);
  }
  
}
/* Adds a top button menu to the passed div. offset_padding will be added to the offset before it is used.*/
function add_button_menu(elem,offset_padding) {
  if (!offset_padding) {
    offset_padding = {top: 0, left: 0};
  }
  var menu_id = elem.attr('id') + '_button_menu';
  if ($('#' + menu_id).length == 0) {
    var menu = create_dom_element('div',{id: menu_id, target: elem.attr('id'), class: 'button_menu'},'',elem);
  } else {
    var menu = $('#' + menu_id);
  }
  var parent_zindex = elem.css('zIndex');
  var menu_width = elem.outerWidth() - (elem.outerWidth() / 4);
  var new_offset = elem.offset();
  new_offset.top -= (menu.outerHeight() - 5);
  new_offset.left += 10;
  new_offset.top += offset_padding.top;
  new_offset.left += offset_padding.left;
  menu.offset(new_offset);
  menu.css({width: menu_width});
  /* we emit the render and include the element, which will be even.packet. You will have to
   decide if it is the menu you want in your listener. probably by checking the id of even.packet.attr('id') == 'my_id'*/
  emit("button_menu.rendered", elem);
}
/* adds a button element, as created by you, to the button menu of the element. note, this function
 wants the parent div element, not the actual button menu.*/
function add_menu_button(elem,button,callback) {
  var menu = elem.find('.button_menu');
  button.css({position: 'relative', display: 'inline-block','margin-right': '5px'});
  menu.append(button);
  if (callback)
    button.on('click',callback);
}
/* Pass in a hex code to get back an object of red, green, blue*/
function to_rgb(hex) {
  var h = (hex.charAt(0)=="#") ? hex.substring(1,7):h;
  var r = parseInt(h.substring(0,2),16);
  var g = parseInt(h.substring(2,4),16);
  var b = parseInt(h.substring(4,6),16);
  return {red: r, green: g, blue: b};
}
function Round(Number, DecimalPlaces) {
  return Math.round(parseFloat(Number) * Math.pow(10, DecimalPlaces)) / Math.pow(10, DecimalPlaces);
}

function RoundFixed(Number, DecimalPlaces) {
  return Round(Number, DecimalPlaces).toFixed(DecimalPlaces);
}



function arrayCompare(a1, a2) {
  if (a1.length != a2.length) return false;
  var length = a2.length;
  for (var i = 0; i < length; i++) {
    if (a1[i] !== a2[i]) return false;
  }
  return true;
}

function inArray(needle, haystack) {
  var length = haystack.length;
  for(var i = 0; i < length; i++) {
    if(typeof haystack[i] == 'object') {
      if(arrayCompare(haystack[i], needle)) return true;
    } else {
      if(haystack[i] == needle) return true;
    }
  }
  return false;
}
/*
 * add_category_button(label,options); Adds a new category button.
 * options is a hash like so:
 * {
 *    id: "the_html_id_youd_like",
 *    handlers: {
 *      mouseup: function (event) { alert('mouseup fired'); }
 *      ...
 *    },
 *    bgcolor: '205,0,82',
 *    bgimage: '/images/myimage.png',
 *    border: {
 *      top: '205,0,85',
 *      ... bottom, left, right etc.
 *    }
 * }
 * */
function add_category_button(label,options) {
  var cat = $('<div id="'+options.id+'" class="category"></div>');
  var cat_label = '<div class="category_label"><span>'+label+'</span></div>';
  var styles = [];
  var bgcolor = "background-color: rgb(XXX);";
  var bgimage = "background-image: url('XXX');";
  //var brdrcolor = "border-color: rgb(top) rgb(right) rgb(bottom) rgb(left);";
  //var brdrcolors = {
    //  top: '85,85,85',
  //  right: '34,34,34',
  //  bottom: '34,34,34',
  //  left: '85,85,85'
  //};
  cat.append(cat_label);
  
  for (var type in options.handlers) {
    cat.bind(type,options.handlers[type]);
  }
  for (var attr in options.attrs) {
    cat.attr(attr,options.attrs[attr]);
  }
  
  if (options.bgcolor) {
    styles.push(bgcolor.replace("XXX",options.bgcolor));
  }
  if (options.bgimage) {
    styles.push(bgimage.replace("XXX",options.bgimage));
  }
  //if (options.border) {
    //  for (var pos in options.border) {
    //    brdrcolor = brdrcolor.replace(pos,options.border[pos]);
    //  }
    //}
    //// Default border colors added later
    //for (var pos in brdrcolors) {
    //  brdrcolor = brdrcolor.replace(pos,brdrcolors[pos]);
    //}
    //styles.push(brdrcolor);
    cat.attr('style',styles.join(' '));
    if (options.data) {
      for (var key in options.data) {
        _set(key,options.data[key],cat);
      }
    }
    $(options.append_to).append(cat);
}
window.shared = {
  element:function (tag,attrs,content,append_to) {
    if (attrs["id"] && $('#' + attrs["id"]).length != 0) {
      var elem = $('#' + attrs["id"]);
      _set('existed',true,elem);
      return elem;
    } else {
      return create_dom_element(tag,attrs,content,append_to)
    }
  },
  date: {
    hm: function (date,sep) {
      if (!date)
        date = new Date();
      if (!sep)
        sep = '';
      return [shared.helpers.pad(date.getHours(),'0',2),shared.helpers.pad(date.getMinutes(),'0',2)].join(sep);
    },
    ymd: function (date,sep) {
      if (!sep)
        sep = '';
      return [
        date.getFullYear(),
        shared.helpers.pad(date.getMonth() + 1,'0',2),
        shared.helpers.pad(date.getDate(),'0',2)
      ].join(sep); 
    },
    ymdhm: function (date,sep) {
      if (!sep)
        sep = '';
      return [
      date.getFullYear(),
      shared.helpers.pad(date.getMonth() + 1,'0',2),
      shared.helpers.pad(date.getDate(),'0',2),
      shared.helpers.pad(date.getHours(),'0',2),
      shared.helpers.pad(date.getMinutes(),'0',2)
      ].join(sep); 
    }
  },
  most_common: function (string,callback,cap,matches,start,start2,keys,results,sorted) {
    var time_start = new Date();
    if (!matches)
      matches = string.match(/(.{4,4})/g);
    if (!results)
      results = {};
    if (!start)
      start = 0;
    for (var i = start; i < matches.length; i++) {
      if (!results[matches[i]])
        results[matches[i]] = 1
      else
        results[matches[i]] += 1
      var now = new Date();
      if ((now - time_start) > 100) {
        setTimeout(function () {
          shared.most_common(string,callback,cap,matches,i+1,null,null,results,null);
        },50);
        return;
      }
    }
    if (!start2)
      start2 = 0;
    if (!keys)
      keys = Object.keys(results);
    if (!sorted)
      sorted = [];
    for (var j = start2; j < keys.length; j++) {
      sorted.push([keys[j],results[keys[j]]]);
      if ((now - time_start) > 100) {
        setTimeout(function () {
          shared.most_common(string,callback,cap,matches,matches.length,j+1,keys,results,sorted);
        },50);
        return;
      }
    }
    sorted.sort(function (a,b){
      if (a[1] > b[1]) {
        return 1;
      }
      if (a[1] < b[1]) {
        return -1;
      }
      return 0;
    });
//     console.log(sorted);
    var new_sorted = [];
    if (!cap)
      cap = 10;
    if (sorted.length < cap)
      cap = sorted.length - 1;
    for (var ii = sorted.length-1; ii > sorted.length - cap; ii--) {
      new_sorted.push(sorted[ii][0]);
    }
    callback.call({},new_sorted);
  },
  compress: function (string,dictionary,callback,start,timer) {
    var time_start = new Date();
    if (!timer)
      timer = new Date();
    if (!start) {
      start = 0;
      console.log("Compressing: ",string.length," chars");
    }
    for (var i = start; i < dictionary.length; i++) {
      if (dictionary[i][1] == '')
        break;
      var reg = new RegExp(dictionary[i][1],'g');
      string = string.replace(reg,dictionary[i][0]);
      var now = new Date();
      if ((now - time_start) > 80) {
        setTimeout(function () {
          shared.compress(string,dictionary,callback,i+1,timer);
        },50);
        return;
      }
    }
    console.log("Compression took: ",((new Date()) - timer) / 1000,'s');
    callback.call({},string);
  },
  decompress: function (string,dictionary,callback,start,timer) {
    var time_start = new Date();
    if (!timer)
      timer = new Date();
    if (!start) {
      start = 0;
    }
    for (var i = start; i < dictionary.length; i++) {
      if (dictionary[i][1] == '')
        break;
      var reg = new RegExp(dictionary[i][0],'g');
      string = string.replace(reg,dictionary[i][1].replace('\\]',']').replace('\\[','['));
      var now = new Date();
      if ((now - time_start) > 80) {
        setTimeout(function () {
          shared.decompress(string,dictionary,callback,i+1,timer);
        },50);
        return;
      }
    }
    console.log("decompression took: ",((new Date()) - timer) / 1000,'s');
    callback.call({},string);
  },
  math: {
    between: function (needle,s1,s2) {
      s1 = parseInt(s1);
      s2 = parseInt(s2);
      needle = parseInt(needle);
      console.log(needle,s1,s2);
      if (needle >= s1 && needle <= s2) {
        console.log('returning true');
        return true;
      }
      return false;
    },
    rand: function (num) {
      if (!num) {
        num = 10000;
      }
      return Math.floor(Math.random() * num);
    },
    to_currency: function (number,separator,unit) {
      var match, property, integerPart, fractionalPart;
      var settings = {         precision: 2,
      unit: i18n.currency_unit,
      separator: i18n.decimal_separator,
      delimiter :'',
      precision: 2
      };
      if ( separator ) {
        settings.separator = separator;
      }
      if ( unit ) {
        settings.unit = unit;
      }
      match = number.toString().match(/([\+\-]?[0-9]*)(.[0-9]+)?/);
      
      if (!match) return;
      
      integerPart = match[1].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + settings.delimiter);
      fractionalPart = match[2] ? (match[2].toString() + "000000000000").substr(1, settings.precision) : "000000000000".substr(1, settings.precision);
      
      return settings.unit + integerPart + ( settings.precision > 0 ? settings.separator + fractionalPart : "");
    },
    to_percent: function (number,separator) {
      unit = '%';
      var match, property, integerPart, fractionalPart;
      var settings = {         precision: 2,
        unit: i18n.currency_unit,
        separator: i18n.decimal_separator,
        delimiter :'',
        precision: 0
      };
      if ( separator ) {
        settings.separator = separator;
      }
      if ( unit ) {
        settings.unit = unit;
      }
      match = number.toString().match(/([\+\-]?[0-9]*)(.[0-9]+)?/);
      
      if (!match) return;
      
      integerPart = match[1].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + settings.delimiter);
      fractionalPart = match[2] ? (match[2].toString() + "000000000000").substr(1, settings.precision) : "000000000000".substr(1, settings.precision);
      
      return '' + integerPart + ( settings.precision > 0 ? settings.separator + fractionalPart : "") + settings.unit;
    },
    to_float: function (str, returnString) {
      if (str == '' || !str) {return 0.0;}
      if (returnString == null) returnString = false;
      if (typeof str == 'number') {
        return shared.math.round(str);
      }
      if (str.match(/\d+\.\d+\,\d+/)) {
        str = str.replace('.','');
      }
      var ac = [0,1,2,3,4,5,6,7,8,9,'.',',','-'];
      var nstr = '';
      for (var i = 0; i < str.length; i++) {
        c = str.charAt(i);
        if (inArray(c,ac)) {
          if (c == ',') {
            nstr = nstr + '.';
          } else {
            nstr = nstr + c;
          }
        }
      }
      return (returnString) ? nstr : shared.math.round(parseFloat(nstr));
    }, // end to_float
    round: function (Number, DecimalPlaces) {
      if (!DecimalPlaces)
        DecimalPlaces = 2
      return Math.round(parseFloat(Number) * Math.pow(10, DecimalPlaces)) / Math.pow(10, DecimalPlaces);
    }
  },
  create: {
    plus_button: function (callback) {
      var button = create_dom_element('div',{class:'add-button'},'','');
      button.on('click',callback);
      return button;
    },
    finish_button: function (callback) {
      var button = create_dom_element('div',{class:'finish-button'},'','');
      button.on('click',callback);
      return button;
    }
  },
  draw: {
    /* returns a happy, centered dialog that you can use to display stuff */
    dialog: function (title,id,clear) {
      var dialog = shared.element('div',{id: id,class: 'salor-dialog'},'',$('body'));
      dialog.css({width: retail.container.width() * 0.50, height: retail.container.height() * 0.30,'z-index':11});
      
      if (_get('existed',dialog)) {
        dialog.html('');
        _set('existed',false,dialog);
      }
      var pad_div = create_dom_element('h2',{class: 'header'},title,dialog);
      dialog.append('<br /><hr />');
      deletable(dialog,function () { $(this).parent().remove()});
      shared.helpers.center(dialog, $(window));
      return dialog;
    },
    loading: function (predraw,align_to) { //we need to predraw this element if we can because it loads an asset
      if (!align_to) {
        align_to = $(window);
      }
      //console.log('showing loader');
      var loader = shared.element('div',{id: 'loader'},'',$('body'));    
      loader.show();
      shared.helpers.center(loader,align_to);
      _set('retail.loader_shown',true);
      _set('retail.show_loading',false);
    },
    hide_loading: function () {
      //console.log('hiding loader');
      var loader = shared.element('div',{id: 'loader'},'',$('body')); 
      loader.hide();
      _set('retail.loader_shown',false);
      _set('retail.show_loading',false);
    },
    option: function (name,append_to,callback,initval,type) {
      if (!initval)
        initval = '';
      var div = shared.element('div',{id: 'option_' + name,class:'options-row'}, '', append_to);
      div.append('<div class="option-name">' + name + '</div>');
      var div2 = shared.element('div',{class:'option-input'}, '', div);
      var input = shared.element('input',{id: 'option_' + name + '_input', type:'text',class:'option-actual-input'},'',div2);
      input.val(initval);
      input.on('keyup',callback);
      input.focus(shared.callbacks.on_focus);
      return div;
    },
    check_option: function (name,append_to,callback,initval) {
      if (!initval)
        initval = false;
      var div = shared.element('div',{id: 'option_' + name.replace(/\s/,''),class:'options-row'}, '', append_to);
      div.append('<div class="option-name">' + name + '</div>');
      var div2 = shared.element('div',{class:'option-input'}, '', div);
      var input = shared.element('input',{id: 'option_' + name.replace(/\s/,'') + '_input', type:'checkbox',class:'option-actual-input'},'',div2);
      input.attr('checked',initval);
      input.change(callback);
      input.checkbox();
      return div;
    },
    select_option: function (name,append_to,callback,initval) {
      if (!initval)
        initval = false;
      var div = shared.element('div',{id: 'option_' + name.replace(/\s/,''),class:'options-row'}, '', append_to);
      div.append('<div class="option-name">' + name + '</div>');
      var div2 = shared.element('div',{class:'option-input'}, '', div);

    },
  },
  helpers: {
    align: function (obj1,obj2,target1,target2) {
      if (!target1) {
        target1 = obj1;
      }
      if (!target2) {
        target2 = obj1;
      }
      if (obj1.outerWidth() > obj2.outerWidth()) {
        target2.css({'padding-left': obj1.outerWidth() - obj2.outerWidth()})
      } else {
        target1.css({'padding-left': obj2.outerWidth() - obj1.outerWidth()})
      }
    },
    pad: function (val,what,length,orientation) {
      val = val.toString();
      if (!orientation)
        orientation = 'left';
      while (val.length < length) {
        if (orientation == 'left')
          val = what + val;
        else
          val = val + what;
      }
      return val;
    },
    paginator: function (elem,result_func) {
      elem.find('.result').remove();
      if (!_get('start',elem)) {
        _set('start',0,elem);
      }
      if (result_func) {
        _set('result_func',result_func,elem);
      } else {
        result_func = _get('result_func',elem);
      }
      var start = _get('start',elem);
      var page_size = _get('page_size',elem);
      if (!page_size) {
        page_size = 5;
      }
      var results = _get('results',elem);
      var offset = elem.offset();
      console.log("paginating",start,page_size,results.length);
      var width = (elem.width() / 10);
      if (width > 35) {
        width = 35;
      }
      var left_tab = shared.element('div',{id: 'paginator_left_tab'},'<',elem);
      left_tab.css({height: (elem.height() / 3), width: width });
      left_tab.offset({left: offset.left - left_tab.outerWidth() + 5});
      if (!_get('existed',left_tab)) {
        left_tab.on('click',function () {
          var start = _get('start',$(this).parent());
          var next = start - page_size;
          if (next < 0) {
            next = 0;
          }
          _set('start',next,elem);
          shared.helpers.paginator(elem,result_func);
        });
      }
      
      var right_tab = shared.element('div',{id: 'paginator_right_tab'},'>',elem);
      right_tab.css({height: (elem.height() / 3), width: width });
      right_tab.offset({left: offset.left + elem.outerWidth() - 5});
      if (!_get('existed',right_tab)) {
        right_tab.on('click',function () {
          var start = _get('start',$(this).parent());
          var results = _get('results',elem);
          var next = start + page_size;
          if (next >= results.length) {
            next = start;
          }
          _set('start',next,elem);
          shared.helpers.paginator(elem,result_func);
        });
      }
      elem.find('.result-count').remove();
      elem.find('.header').append("<span class='result-count'>("+results.length+")</span>");
      
      for (var i = start; i < start + page_size; i++) {
        var obj = results[i];
        if (obj) {
          result_func.call(elem,obj);
        }
      }
    },
    merge: function (obj1,obj2) {
      if (obj1 == null)
        return obj2
      if (obj1 instanceof Object && obj2 instanceof Object) {
        for (var key in obj2) {
          if (obj1[key]) {
            if (obj1[key] instanceof Object && obj2[key] instanceof Object) {
              obj1[key] = shared.helpers.merge(obj1[key],obj2[key]);
            } else {
              obj1[key] = obj2[key];
            }
          } else {
            obj1[key] = obj2[key];
          }
        }
      } // end if
      return obj1;
    },
    to_inline_block: function (elem) {
      elem.css({position: 'relative', display: 'inline-block'});
      return elem;
    },
    expand: function (elem,amount,direction) {
      if (!direction)
        direction = 'both';
      if (direction == 'both' || direction == 'vertical') {
        elem.css({height: elem.outerHeight() + (elem.outerHeight() * amount)});
      }
      if (direction == 'both' || direction == 'horizontal') {
        elem.css({width: elem.outerWidth() + (elem.outerWidth() * amount)});
      }
    },
    shrink: function (elem,amount,direction) {
      if (!direction)
        direction = 'both';
      if (direction == 'both' || direction == 'vertical') {
        elem.css({height: elem.outerHeight() - (elem.outerHeight() * amount)});
      }
      if (direction == 'both' || direction == 'horizontal') {
        elem.css({width: elem.outerWidth() - (elem.outerWidth() * amount)});
      }
    },
    /* Center an element on the page, second argument is the element to center it to*/
    center: function (elem,center_to_elem,add_offset) {
      if (!center_to_elem)
        center_to_elem = $(window);
      var offset = center_to_elem.offset();
      if (!offset) {
        offset = {top: 0, left: 0};
      }
      var width = elem.outerWidth();
      var height = elem.outerHeight();
      var swidth = center_to_elem.width();
      var sheight = center_to_elem.height();
      sheight = Math.floor((sheight / 2) - (height / 2));  
      elem.css({position: 'absolute'});
      var ntop = offset.top + sheight;
      var nleft = offset.left + Math.floor((swidth / 2) - (width / 2));
      if (add_offset) {
        ntop += add_offset.top;
        nleft += add_offset.left;
      }
      var new_offset = {top: ntop, left: nleft};
      elem.offset(new_offset);
    }, //end center
    bottom_right: function (elem,center_to_elem) {
      var offset = center_to_elem.offset();
      offset.top += center_to_elem.height() - elem.outerHeight();
      offset.left += center_to_elem.width() - elem.outerWidth();
      elem.css({position: 'absolute'});
      elem.offset(offset);
    },
    top_left: function (elem,center_to_elem) {
      elem.css({position: 'absolute'});
      var offset = center_to_elem.offset();
      elem.offset(offset);
    },
    position_rememberable: function (elem) {
      var key = 'position_rememberable.' + elem.attr('id');
      var position = JSON.parse(localStorage.getItem(key));
      elem.css({position: 'absolute'});
      if (!position) {
        console.log('setting to offset');
        position = elem.offset();
        localStorage.setItem(key, JSON.stringify(position));
      } else {
        elem.offset(position);
      }
      elem.draggable({
        stop: function () {
          console.log('saving position',key,$(this).offset());
          localStorage.setItem(key, JSON.stringify($(this).offset()));
        }
      });
    }
  }, // end helpers
  callbacks: {
    on_focus: function () {
      $('.has-focus').removeClass('has-focus');
      $(this).addClass('has-focus');
    },
  },
  control: {
    task_manager: function (task_set) {
      var self = this;
      this._task_set = task_set;
      this.add = function (name,callback,priority,permanent,context) {
        for (var i = 0; i < self._task_set.length; i++) {
          if (self._task_set[i].name == name) {
            console.log('that task is already scheduled');
            return;
          }
        }
        var task = {
          name: name,
          callback: callback,
          priority: priority,
          is_permanent: permanent,
          context: context
        }
        self._task_set.push(task);
        self._task_set.sort(function (a,b) {
          if (a.priority < b.priority)
            return -1
          if (a.priority == b.priority)
            return 0
          if (a.priority > b.priority)
            return 1
        });
      }
      this.run = function () {
        console.log('TaskManager Runnging');
        var time_start = new Date();
        var times = self._task_set.length;
        for (var i = 0; i < times; i++) {
          t = self._task_set.reverse().pop();
          self._task_set.reverse();
          self.run_task(t);
          var now = new Date();
          if (now - time_start > 150) {
            return;
          }
        }
      }
      this.run_task = function (t) {
        console.log('calling',t);
        t.callback.call(t.context);
        if (t.is_permanent) {
          this._task_set.push(t);
        }
      }
    }
  },
} // end shared
