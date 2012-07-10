var base_dictionary = [
// ['\xa6','"name":"'],['\xa7','"price":'],['\xa8','"position":'], ['\xa9','"quantity_sold":'],
// ['\xaa','"sku":"'],['\xab','"tax_id":'],['\xbf','"items":'],['\xc0','"hidden":'], ['\xc1','"discounts":'],['\xc2','"payment_methods":'],['\xc3','"paid":'], ['\xc4','"quantity":'],['\xc5','"taxes":'],['\xc6','"amount":'],
// ['\xc7','"total":'],['\xc8','"tax_amount":'], ['\xc9','"discount_amount":'],['\xca','"ident":'],['\xac','000'],
// ['\xad','":{'],['\xae','00'],['\xaf','null'], ['\xb0','true'],['\xb1','false'],['\xb2','}}'],['\xb3','{{'],['\xb4','\\[{'],['\xb5','}\\]'],['\xb6','"c":"#'], ['\xb7',',"l":"'],['\xb8',',"n":"'],['\xb9',',"vpid":'],['\xba','},"'],
// ['\xbb','"id":'],['\xbc','"p":'], ['\xbd','","'],['\xbe','"i":'],
  
];

var orders_dictionary = [
// ['\xa6','{"items":'],
// ['\xa7','"discounts":'],
// ['\xa8','"paid":true,'], 
// ['\xa9','"rebate":0,'],
// ['\xaa','"id":'],
// ['\xab','"ai":'],
// ['\xac','"price":'],
// ['\xad','"hidden":false}'], 
// ['\xae','"payment_methods":'],
// ['\xaf','"quantity":1,'],
// ['\xb0','"taxes":'],
// ['\xb1','"amount":"'],
// ['\xb2','"total":'],
// ['\xb3','"tax_amount":'], 
// ['\xb4','"discount_amount":'],
// ['\xb5','"change":0,'],
// ['\xb6','"d":"20'],
// ['\xb7','null'], 
// ['\xb8','"hidden":true}'],
// ['\xb9','true'],
// ['\xba','false'],
// ['\xbb','"a":'],
// ['\xbc','},{'],
// ['\xbd','"n":"'],
// ['\xbe','"quantity":'],
// ['\xbf','"rebate":'],
// ['\xc0','"hidden":false,'],
// ['\xc0','"change":']
];
var _i18n;
window._t = function (word) {
  if (!_i18n || !_i18n[word])
    return '*' + word;
  if (!_i18n[word][retail.config.language]) {
    return '*' + word; 
  }
  return _i18n[word][retail.config.language];
}
/* FIXME To be on the safe side, i created a second one for now 
 add_payment_method should be complete agnostic.*/
var payment_method_uid = 0;
function split_num(number) {
  number = parseInt(number);
  if (number > 57920) {
    var str = number.toString();
    var len = str.length;
    var split = Math.floor(len / 2);
    var p1 = str.substr(0,split);
    var p2 = str.substr(split,str.length);
    var i = 0;
    while (p2[i] == '0') {
      split--;
      var p1 = str.substr(0,split);
      var p2 = str.substr(split,str.length);
    }
    return [p1,p2];
  }
  return [number];
}
function convert_to_unicode(number) {
  number = parseInt(number);
  number += 256;
  var parts = [];
  if (number > 57920) {
    if (number.toString().match(/[\d][0]{4,}$/) ||
      number.toString().match(/[\d][0]{3,}\d$/)) {
      return number;
    }
    var p1 = split_num(number)[0];
    var p2 = split_num(number)[1];
    if (parseInt(p1) > 57920) {
      var tp1 = split_num(p1)[0];
      var tp2 = split_num(p1)[1];
      parts.push(tp1);
      parts.push(tp2);
    } else { parts.push(p1) }
    if (parseInt(p2) > 57920) {
      var xp1 = split_num(p2)[0];
      var xp2 = split_num(p2)[1];
      parts.push(xp1);
      parts.push(xp2);
    } else { parts.push(p2) }
  } else {
    parts.push(number);
  }
  var chars = [];
  for (var i = 0; i < parts.length; i++) {
    chars.push(String.fromCharCode(parts[i]));
  }
  return chars.join('');
}
function convert_from_unicode(number) {
  if (number.toString().match(/[\d][0]{4,}$/) ||
    number.toString().match(/[\d][0]{3,}\d$/)) {
    return number;
    }
    if (number.length > 1) {
    var val = '';
    for (var i = 0; i < number.length; i++) {
      val += number.charCodeAt(i).toString();
    }
    return parseInt(val) - 256;
  }
  return number.charCodeAt(0) - 256;
}
//convert a price field or total field to a float
//prices are stored as unicode mapped ints
function to_price(p) {
  return convert_from_unicode(p) / 100;
}
//convert a float to a price or total field
function from_price(p) {
  return convert_to_unicode(p * 100);
}
// convert an article id from a compressed version
// this is because article ids are saved on order items, alot
// if you have 20 articles, no problem, but when you have 2-3 thousand
// it starts to take up alot of space.
// Article with an id of 1029 will take up 8bytes of space
// so we convert it to a 2 byte unicode value.

/*
  Let's say the average number of items on an order is 10.
  That would be 80 bytes per order, just for the article ids.
  That's 780k for 10,000 orders just for one field. That's almost
  1mb of our small 5-10 mb database.
  
  With a software as service, article ids can become huge,
  it's not unreasonable to think that ids might start at
  20000 (12 bytes) and move up. You might only have 10 items, but their id
  fields are 20000 to 200010. With this method, we can store 12bytes with 4 bytes
  or 70% compression.
 */
function to_int(id) {
  return convert_from_unicode(id);
}
//convert an article id to a compressed version
function from_int(id) {
  return convert_to_unicode(id)
}
function add_payment_method2(target) {
  payment_method_uid += 1;
  pm_row = $(document.createElement('div'));
  pm_row.addClass('payment_method_row');
  pm_row.attr('id', 'payment_method_row' + payment_method_uid);
  // we might not be using submit_json
  //submit_json.payment_methods[model_id][payment_method_uid] = {id:null, amount:0};
  var j = 0;
  $.each(retail.database.payment_methods, function(k,v) {
    j += 1;
    
    pm_button = create_dom_element('span',{id: 'payment_method_button_' + v.id +'_'+payment_method_uid,class:'payment_method payment-method-' + v.id},v.n,pm_row);
    _set('payment_method',retail.payment_methods.copy(v),pm_button);
    if ( j == 1 ) {
      //submit_json.payment_methods[model_id][payment_method_uid].id = v.id;
      pm_button.addClass('selected');
      console.log("Setting default pm");
      _set('payment_method',v,pm_row);
    }
    (function() {
      var uid = payment_method_uid;
      pm_button.on('click', function() {
        //submit_json.payment_methods[model_id][uid].id = v.id;
        var payment_method = _get('payment_method',$(this));
        _set('payment_method',payment_method,$(this).parent());
        emit('payment_method.selected',{payment_method: payment_method,payment_method_uid: uid, payment_method_id: v.id});
        $('#payment_method_row' + uid + ' span').removeClass('selected');
        $(this).addClass('selected');
        $('#payment_method_' + uid + '_amount').select();
        if(settings.workstation) {
          $('#payment_method_'+ uid + '_amount').select();
          //$('#payment_method_row'+ uid + ' .ui-keyboard-input').select();
        }
      });
    })();
    //pm_row.append(pm_button);
  });
  pm_input = create_dom_element('input', {id: 'payment_method_' + payment_method_uid + '_amount', type: 'text',class: 'payment-method-amount payment-method-amount'},'',pm_row);
  if (settings.workstation) {
    (function(){
      var uid = payment_method_uid;
      var element = pm_input;
      element.keyboard({
        openOn: 'click',
        accepted: function(){ 
          
          var payment_method = _get('payment_method',element.parent());
          payment_method.amount = element.val();
          emit('payment_method.updated',{payment_method: payment_method,payment_method_uid: uid, element: pm_input});
        },
        layout:'num'
      });
    })()
  }
  (function() {
    var uid = payment_method_uid;
    pm_input.on('keyup', function(){
      
      var payment_method = _get('payment_method',$(this).parent());
      payment_method.amount = $(this).val();
      emit('payment_method.updated',{payment_method: payment_method,payment_method_uid: uid, element: $(this)});
    });
  })();
  pm_row.append(pm_input);
  deletable(pm_row,'append',function () {
    $(this).parent().remove();
  });
  target.append(pm_row);
}
i18n = {decimal_separator: '.',currency_unit: '$'};
var settings = {workstation: true};
var TaskManager = '';
_beast_lives = false;
$(function () {
  _set('retail.tasks',[]);
  TaskManager = new shared.control.task_manager(_get('retail.tasks'));
  setInterval(TaskManager.run,3000);
  $(window).resize(retail.callbacks.on_window_resize);
  retail.show_pos_container();
  setTimeout(function () {
    _set('retail.show_loading',true);
  },50);
  retail.load_database(function() {
    
    var __pos_orders_index = parseInt(localStorage.getItem('retail.orders.index'));
    if (!__pos_orders_index) {
      __pos_orders_index = 0;
    }
    retail.orders.index = __pos_orders_index;
    if (!retail.database.orders[retail.orders.index] || retail.orders.current().paid == true) {
      retail.orders.create();
    }
    
    var __pos_drawer = localStorage.getItem('retail.drawer_database');
    if (!__pos_drawer) {
      retail.database.drawer = JSON.parse(__pos_drawer);
    } else {
      retail.database.drawer = {total: 0};
    }
    var __pos_user = localStorage.getItem('retail.user');
    if (__pos_user && __pos_user != 'undefined') {
      retail.user = JSON.parse(__pos_user);
    }
    if (!retail.articles.index) {
      retail.articles.build_index(null,null,function () {
        if (retail.user) {
          retail.draw.interface();
        } else {
          retail.draw.login();
        }
      });
    }
    
    _i18n = retail.database.i18n;
    
    
  });
  
  connect('retail.on_partial_search_result.partial','retail.article_search.partial_result', retail.callbacks.on_article_search_result);
  connect('retail.on_partial_search_result.complete','retail.article_search.complete', retail.callbacks.on_article_search_result);
  connect('retail.payment_method.updated','payment_method.updated',retail.draw.change);
  
  
  
  setInterval(function () {
    // Otherwise, we could be drawing the interface more than is really necessary.
    if (_get('retail.dirty')) {
      console.log("redrawing");
      retail.draw.interface();
      _set('retail.dirty',false);
    }
    if (_get('retail.show_loading') && !_get('retail.loader_shown')) {
      if (retail.articles_container && retail.articles_container.is(":visible")) {
        shared.draw.loading(false,retail.articles_container);
      } else {
        shared.draw.loading();
      }
      _set('retail.show_loading',false)
    }
    if (_get('retail.hide_loading') && _get('retail.loader_shown')) {
      shared.draw.hide_loading();
      _set('retail.hide_loading',false);
    }
  },100);
});
/* This works like a namespace, to avoid collisions with existing javascript that is becoming quite large...*/
var retail = {
  remote: {
    check: function () {
      _fetch(retail.config.remote_server + '/beast.php?action=hello',function () {
        if (_beast_lives)
          console.log("It's Alive! God in Heaven, it's ALIVE!!!");
        else
          console.log("It's dead Jim.");
      })
    }
  },
  
  wipe: function () {
    localStorage.clear();
  },
  payment_methods: {
    find_by_id: function (payment_id) {
      console.log("get_pm");
      for (var i = 0; i < retail.database.payment_methods.length; i++) {
        var pm = retail.database.payment_methods[i];
        if (pm.id == payment_id)
          return pm;
      }
    },
    copy: function (pm) {
      return {id: pm.id, amount: 0};
    }
  },
  discounts: {
    find_by_id: function (id) {
      return retail.database.discounts[id.toString()];
    },
    copy: function (discount) {
      // we only need some attrs for orders and items.
      return {id: discount.id, ai: discount.ai, a: discount.a};
    },
    calculate_new_total: function (total,a) {
      var da = 0;
      if (a.discounts && a.discounts.length > 0) {
        for (var i = 0; i <  a.discounts.length; i++) {
          var discount = a.discounts[i];
          var dm = total * (shared.math.to_float(discount.a)/100);
          da = da + dm;
        }
      }
      
      if (da > 0) {
        total -= da
      }
      return shared.math.round(total,2);
    }
  },
  /* article functions */
  articles: {
    find_id_by_sku: function (sku) {
      return retail.database.articles[sku].id;
    },
    find_by_id: function (id) {
      var sku = retail.articles.index[id.toString()];
      return retail.database.articles[sku];
    },
    find_by_sku: function (sku) {
      return retail.database.articles[sku];
    },
    build_index: function (start,keys,callback) {
      var timer = new Date();
      if (!retail.index)
        retail.articles.index = {};
      if (!start)
        start = 0;
      if (!keys)
        keys = Object.keys(retail.database.articles);
      for (var i = start; i < keys.length; i++) {
        var key = keys[i];
        var a = retail.database.articles[key];
        retail.articles.index[a.id.toString()] = a.sku;
        var now = new Date();
        if (now - timer > 200) {
          setTimeout(function () {
            retail.articles.build_index(i+1,keys);
          },50);
        }
      }
      _set('retail.hide_loading',true);
      callback.call({});
    }
  },
  items: {
    total: function (item) {
      var total = to_price(item.price) * item.quantity;
      total -= (item.rebate / 100) * total;
      return retail.discounts.calculate_new_total(total,item);
    }
  },
  /* order functions */
  orders: {
    index: 0,
    total: function (order) {
      var total = 0;
      for (var i = 0; i < order.items.length; i++) {
        total += retail.items.total(order.items[i]);
      }
      total -= (order.rebate / 100) * total;
      
      return retail.discounts.calculate_new_total(total,order);
    },
    /* Objects in js are passed by reference, meaning what is returned is a pointer! */
    get_item: function (sku) {
      console.log(sku);
      var id = retail.articles.find_id_by_sku(sku);
      for (var i = 0; i < retail.orders.current().items.length; i++) {
        console.log(id,retail.orders.current().items[i].id);
        var item = retail.orders.current().items[i];
        if (id == item.id) {
          if (item.hidden == true) {
            retail.orders.add_discounts(item);
            item.hidden = false;
          }
          return item;
        }
      }
      return retail.orders.new_item(sku);
    },
    // this can take an item or an order
    has_discount: function (item,discount) {
      for (var i = 0; i < item.discounts.length; i++) {
        if (discount.id == item.discounts[i].id)
          return true
      }
      return false;
    },
    add_discounts: function (item) {
      var time = parseInt(shared.date.hm());
      var article = retail.articles.find_by_id(item.id);
      $.each(retail.database.discounts,function (k,v) {
        if (v.ai != 0 && v.as == article.sku && retail.orders.has_discount(item,v) == false) {
          item.discounts.push(retail.discounts.copy(v));
        } else if (v.tb == 1 && shared.math.between(time,v.st,v.et) && retail.orders.has_discount(item,v) == false) {
          item.discounts.push(retail.discounts.copy(v));
        }
      });
    },
    remove_discount: function (article,discount) {
      var nd = [];
      for (var i = 0; i < article.discounts.length;i++) {
        if (discount.id == article.discounts[i].id) {
          console.log(discount.id,'equals',article.discounts[i].id);
        } else {
          nd.push(article.discounts[i]);
        }
      }
      article.discounts = nd;
    },
    /* This is where we add a new item*/
    new_item: function (sku) {
      var article = retail.articles.find_by_sku(sku);
      var item =  {id: article.id, quantity: 0, rebate: 0, price: from_price(article.price), discounts: []};
      retail.orders.add_discounts(item);
      retail.orders.current().items.push(item);
      return item;
    },
    draw: function (order) {
      try {
        $.each(order.items,function (key,value) {
          retail.draw.article_row(value);
        });
      } catch (err) {
        console.log("Drawing order.items failed because:",err,order.items);
      }
    },
    draw_options: function () {
      var dialog = shared.draw.dialog(_t('Options'),'order_options_dialog');
      dialog.show();
      add_button_menu(dialog);
      var discount_button = shared.helpers.to_inline_block( create_dom_element(
        'div',
        {
          class:'discounts-button retail-item-menu-button'
        },
        '',
        '')
      );
      _set('target',retail.orders.current(),discount_button); // i.e. where to add the discount
      add_menu_button(dialog,discount_button,retail.callbacks.on_show_discounts);
      
      shared.helpers.center(dialog);
      shared.helpers.position_rememberable(dialog);
      shared.draw.option(_t('Rebate'),dialog,function () {
        var o = retail.orders.current();
        o.rebate = $(this).val();
        retail.orders.current(o);
        retail.orders.update_totals();
        retail.orders.save();
      },retail.orders.current().rebate);
    },
    create: function () {
      console.log('retail.orders.create');
      var o = {items: [], discounts: [], paid: false, rebate: 0};
      if (!retail.database.orders || retail.database.orders == 'undefined') {
        retail.database.orders = [];
      }
      retail.database.orders.push(o);
      retail.orders.index = retail.database.orders.length - 1;
      console.log("Created new order: ",retail.orders.index);
    },
    complete: function (id) {
      retail.callbacks.on_remove_item_menu();
      var o = retail.database.orders[id];
      console.log('got',id,o);
      o.paid = true;
      o.d = convert_to_unicode(shared.date.ymdhm(new Date()));
      try {
        if (!o.payment_methods) {
          o.payment_methods = [];
        }
        $.each($('.payment_method_row'),function (k,v) {
          o.payment_methods.push(_get('payment_method',$(v)));
        });
      } catch (err) {
        console.log('failed while adding payment methods',err);
      }
      try {
        if (id == retail.orders.index) {
          $('.article-row').remove();
          retail.orders.create();
          retail.orders.draw(retail.database.orders[retail.orders.index]);
        }
      } catch (err) {
        console.log('failed while creating new order',err.stack);
      }
      retail.orders.save();
    },
    save: function () {
      var bd = localStorage.getItem('retail.base_dictionary');
      if (!bd || bd == 'undefined') {
        bd = base_dictionary;
      } else {
        bd = JSON.parse(bd);
      }
      _set('retail.show_loading',true);
      localStorage.setItem('retail.base_dictionary',JSON.stringify(bd));
      var db = JSON.stringify(retail.database.orders);
      shared.compress(db,orders_dictionary,function (string) {
        localStorage.setItem('retail.orders_database',string);
      _set('retail.show_loading',false);
      });
      localStorage.setItem('retail.orders.index',retail.orders.index);
    },
    current: function (order) {
      if (!order) {
        return retail.database.orders[retail.orders.index];
      } else {
        retail.database.orders[retail.orders.index] = order;
      }
      console.log(order);
    },
    clear: function () {
      retail.database.orders = [];
      localStorage.setItem('retail.orders_database',null);
      localStorage.setItem('retail.orders.index',null);
    },
    update_totals: function () {
      
      var grand_total = 0;
      $.each(retail.articles_container_table.find('tr'),function (key,value) {
        value = $(value);
        var a = _get('article',value);
        var total = shared.math.to_float(value.find('.quantity').html()) * shared.math.to_float(value.find('.price').html());
        if (a.rebate > 0) {
          var ra = shared.math.to_float((total * (shared.math.to_float(a.rebate)/100)));
          total -= ra;
        }
        total = retail.discounts.calculate_new_total(total,a);
        grand_total += total;
        value.find('.total').html(shared.math.to_currency(total));
      });
      if (retail.orders.current().rebate > 0) {
        retail.orders.current().ra = shared.math.to_float((grand_total * (retail.orders.current().rebate / 100)));
        grand_total -= retail.orders.current().ra;
      }
      if (retail.orders.current().discounts.length > 0) {
        grand_total = retail.discounts.calculate_new_total(grand_total,retail.orders.current());
      }
      retail.control_panel.find("#order_total").html(shared.math.to_currency(grand_total));
      retail.orders.save();
    },
  },
  /* Containers for elements on the screen*/
  container: null,
  user: null,
  articles_container: null,
  articles_container_table: null,
  button_container: null,
  control_panel: null,
  active_popup: null,
  /* The Seed database object for the first load, this should be overwritten if a local
   * version exists. */
  database: {orders: [],i18n: {
    "Finish": {
      "en-US": "Finish",
      "gn": "Abschliessen",
    },
    "Complete Order": {
      "en-US":"Complete Order",
      "gn":"Verkaufe abschliessen"
    },
    "Change": {
      "en-US":"Change",
      "gn":"Wechselgeld"
    },
    "Search Results": {
      "en-US":"Search Results",
      "gn":"Suchergebnisse"
    }
  }},
  /* 
   * This is the seed config, it should be overwritten by local changes. 
   */
  config: {
    api_key: 'localhost',
    remote_server: 'http://localhost/salor',
    drawer_transaction_codes: {
      complete_order: 0,
      cash_drop: 1,
      payout: 2
    },
    languages: ['en-US','en-GB','gn','ru','cn'],
    language: 'gn',
    control_panel: {
      denominations: '5:cash:1,10:cash:1,20:cash:1,50:cash:1,100:cash:1,200:cash:1,Card:card:2,Check:check:3',
      button_padding: '3% 1% 3% 1%',
      finish_button_padding: '5% 0 5% 0'
    },
    buttons: {
      height: 0,
      close_on_click: true
    },
    orders: {
      tax_included: false
    }
  },
  /* 
   * Generic POS control functions 
   */
  show_pos_container: function () {
    /* Sometimes we are working with a small screen, and real-estate isn't cheap, so we hide everything and redraw only what we need.*/
    $('#main').hide();
    $('#header').hide();
    $('body').css({'overflow':'hidden'});
    $('#pos_container').show();
    $('#pos_container').css({width: $(window).width()});
    retail.container = $('#pos_container');
    $('#pos_container').css({height: $(window).height() - 2, width: $(window).width() - 2});
  },
  hide_pos_container: function () {
    $('#pos_container').hide();
    $('#main').show();
    $('#header').show();
  },
  refresh_database: function () {
    _fetch('/articles/json_database',retail.callbacks.on_database_refresh);
    _fetch('/categories/json_database',retail.callbacks.on_database_refresh);
  },
  save_database: function () {
    var bd = localStorage.getItem('retail.base_dictionary');
    if (!bd || bd == 'undefined') {
      bd = base_dictionary;
    } else {
      bd = JSON.parse(bd);
    }
    _set('retail.show_loading',true);
    localStorage.setItem('retail.base_dictionary',JSON.stringify(bd));
    for (var key in retail.database) {
      if (key == 'articles' && Object.keys(retail.database.articles).length > 1000) {
        /* We don't save the articles when there are so many, they take up too much space. Articles should be store on the server and restored
         when they load the page. 
        */
        if (_beast_lives) {
          // store any artlicle changes on the remote end.
          _push(retail.config.remote_server + '/beast.php?action=save_articles',retail.database.articles)
        }
        continue;
      }
      var dict = bd;
      console.log(key);
      if (key == 'orders') {
        console.log('using orders dict');
        dict = orders_dictionary;
      }
      if (_beast_lives) {
        var payload = {};
        payload[key] = retail.database[key];
        _push(retail.config.remote_server + '/beast.php?action=save_' + key,payload);
      }
      shared.compress(JSON.stringify(retail.database[key]),dict,function (string) {
        
        localStorage.setItem('retail.'+key+'_database',string);
        console.log(key + ' database saved','retail.'+key+'_database');
      });
    }
    shared.compress(JSON.stringify(retail.config),bd,function (string) {
      console.log('setting retail.config',string);
      localStorage.setItem('retail.config',string);
    });
    
    _set('retail.hide_loading',true);
    
    //localStorage.setItem('retail.categories_database',JSON.stringify(retail.database.categories));
    //localStorage.setItem('retail.taxes_database',JSON.stringify(retail.database.taxes));
  },
  load_database: function (callback) {
    if (DATABASE) {
      retail.database = DATABASE;
    }
    _set('retail.articles_loaded',false);
    _set('retail.categories_loaded',false);
    _set('retail.taxes_loaded',false);
    _set('retail.orders_loaded',false);
    _set('retail.users_loaded',false);
    _set('retail.payment_methods_loaded',false);
    _set('retail.i18n_loaded',false);
    _set('retail.discounts_loaded',false);
    var tmp_func = function () {
      console.log('tmp func called', 
                  _get('retail.articles_loaded'), 
                  _get('retail.categories_loaded'),
                  _get('retail.taxes_loaded'),
                  _get('retail.orders_loaded'),
                  _get('retail.users_loaded'),
                  _get('retail.users_loaded'),
                  _get('retail.i18n_loaded'),
                  _get('retail.discounts_loaded')
                 );
      if (
            _get('retail.articles_loaded') && 
            _get('retail.categories_loaded') &&
            _get('retail.taxes_loaded') &&
            _get('retail.orders_loaded') &&
            _get('retail.payment_methods_loaded') &&
            _get('retail.i18n_loaded') &&
            _get('retail.discounts_loaded') &&
            _get('retail.users_loaded')
      ) {
        callback.call({});
      } else {
        setTimeout(tmp_func,50);
      }
    }
    setTimeout(tmp_func,50);
   
    var bd = localStorage.getItem('retail.base_dictionary');
    if (!bd || bd == 'undefined') {
      bd = base_dictionary;
      localStorage.setItem('retail.base_dictionary',JSON.stringify(bd));
    } else {
      bd = JSON.parse(bd);
    }
    var config = localStorage.getItem('retail.config');
    if (config && config != 'null' && config != 'undefined') {
      shared.decompress(config,bd,function (string) {
        retail.config = JSON.parse(string);
      });
    }
    $.each(['discounts','i18n','payment_methods','users','orders','taxes','articles','categories'],function (key,value) {
      var db = localStorage.getItem('retail.'+value+'_database');
      if ( (!db || db == 'undefined' || db == 'null') && value != 'orders') {
        _set('retail.'+value+'_loaded',true);
      } else if (value == 'orders' && (!db || db == 'undefined') ) {
        retail.database.orders = [];
        _set('retail.'+value+'_loaded',true);
      } else {
        var dict = bd;
        console.log(value);
        if (value == 'orders') {
          console.log('using orders dict');
          dict = orders_dictionary;
        }
        var cb = (function (d,v) {
          var dict = d;
          var value = v;
          return function (string) {
            try {
              var db = JSON.parse(string);
              retail.database[value] = db;
              _set('retail.'+value+'_loaded',true);
            } catch (err) {
              console.log("Received error, trying to repair",string);
              shared.decompress(string,dict,function (string) {
                var db = JSON.parse(string);
                retail.database[value] = db;
                _set('retail.'+value+'_loaded',true);
              });
            } // end of try
          }
        })(dict,value);
        shared.decompress(db,dict,cb);
      }
    });
  },
  /* 
   * Functions for drawing things on the screen
   */
  draw: {
    login: function () {
      var dialog = shared.draw.dialog(_t('Login'),'login_dialog');
      dialog.show();
      shared.helpers.center(dialog);
      shared.helpers.shrink(dialog,0.20);
      dialog.find('.delete').remove();
      var complete_button = create_dom_element('div',{class: 'ok-button'},"OK",dialog);
      shared.helpers.bottom_right(complete_button,dialog);
      complete_button.on('click',retail.callbacks.on_login);
      shared.draw.option('',dialog,function () {});
      dialog.find('.option-name').remove();
      dialog.find('.option-input').css({width: '100%', height: '45px','text-align':'center'});
      if (!_get('existed',dialog)) {
      dialog.find('.option-actual-input')
            .addClass('login-input')
            .css({width: '80%', height: '45px'})
            .focus()
            .on('keyup',retail.callbacks.on_keyup);
      }
    },
    interface: function () {
      retail.show_pos_container();
      $('#login_dialog').hide();
      retail.draw.button_container();
      retail.draw.categories(retail.database.categories);
      retail.draw.control_panel();
      retail.draw.articles_container();
    },
    hide_interface: function () {
      retail.show_pos_container();
      retail.draw.login();
      retail.button_container.hide();
      retail.control_panel.hide();
      retail.articles_container.hide();
    },
    button_container: function () {
      var d = shared.element('div',{id:'button_container'},'',retail.container);
      d.show();
      var height = $(window).height() * 0.38;
      d.css({ width: $(window).width() - 5,height: height,top: ($(window).height() * 0.62) });
      if (retail.config.buttons.height > 0) {
        var diff = d.outerHeight() - retail.config.buttons.height;
        if (diff > 0) {
          d.offset({top: d.offset().top + diff});
        }
        d.css({height: retail.config.buttons.height});
      }
      retail.button_container = d;
      emit("retail.button_container.rendered",retail.button_container);
    },
    articles_container: function () {
      var d = shared.element('div',{id:'articles_container'},'',retail.container);
      d.show();
      var height = $(window).height() * 0.60;
      d.css({height: height,top: 10  + "px", width: $(window).width() * 0.58 + "px"});
      retail.articles_container = d;
      retail.articles_container_table = shared.element('table',{id: 'articles_container_table',width: '100%', align: 'center'},'',retail.articles_container);
      emit("retail.articles_container.rendered",retail.articles_container);
      if (retail.database.orders[retail.orders.index].paid == false) {
        retail.orders.draw(retail.database.orders[retail.orders.index]);
      }
    },
    control_panel: function () {
      var d = shared.element('div',{id:'control_panel'},'',retail.container);
      d.show();
      var height = $(window).height() * 0.60;
      d.css({width: $(window).width() * 0.395 + "px", left: $(window).width() * 0.60, height: height,top: 10  + "px"});
      retail.control_panel = d;
      var total_target = shared.element('div',{id: 'order_total'},shared.math.to_currency(0),retail.control_panel);
      total_target.on('click',retail.orders.draw_options);
      total_target.css({position: 'absolute','width':'99%','padding': '1%'});
      var offset = total_target.offset();
      offset.top += total_target.outerHeight() + 2;
      offset.left += retail.control_panel.width() * 0.20;
      var sku_input_container = shared.element('div',{id:'sku_input_container'},'',retail.control_panel);
      var sku_input = shared.element('input',{id: 'sku_input'},'',sku_input_container);
      offset.top -= 10;
      if (_get('existed',sku_input)) {
        
      } else {
        sku_input.on('keyup',retail.callbacks.on_keyup);
        sku_input.focus(shared.callbacks.on_focus);
      }
      sku_input_container.css({position: 'absolute',width: total_target.width() * 0.60});
      sku_input_container.offset(offset);
      var complete_button = shared.element('div',{id: 'complete_button'},_t('Finish'),retail.control_panel);
      offset.top += sku_input.outerHeight() + 20;
      complete_button.offset({top: offset.top});
      complete_button.css({padding: retail.config.control_panel.finish_button_padding});
      if (!_get('existed',complete_button)) {
        complete_button.on('click',retail.callbacks.on_complete_order);
      }
      offset.top += complete_button.outerHeight() + 5;
      $('.retail-denomination-button').remove();
      var denomination_button_container = shared.element('div',{id:'denomination_container'},'',retail.control_panel);
      denomination_button_container.offset({top: offset.top});
      $.each(retail.config.control_panel.denominations.split(','),function (key,value) {
        var text = '';
        var parts = [];
        if (value.indexOf(':') != -1) {
          parts = value.split(':');
        } else {
          parts = [value,'cash'];
        }
        var button = create_dom_element('div',{class: 'retail-denomination-button'},parts[0],denomination_button_container);
        button.css({padding: retail.config.control_panel.button_padding});
        if (parts[1] != 'cash') {
          button.addClass('retail-denomination-button-text retail-denomination-button-' + parts[1]);
        }
        _set('payment_type',parts[1],button);
        _set('payment_id',parts[2],button);

        button.on('click',function () {
          var pm = retail.payment_methods.find_by_id(_get('payment_id',$(this)));
          var button = $(this);
          $('#complete_button').trigger('click');
          setTimeout(function () {
            var amount = shared.math.to_float(button.html());
            var pm_button = $('.payment-method-' + pm.id).filter(':first');
            pm_button.trigger('click');
            var pm_input = pm_button.parent().find('.payment-method-amount');
            console.log(typeof amount,amount);
            if (isNaN(amount)) {
              console.log('not a num');
              amount = shared.math.to_float($('#order_total').html());
            }
            pm_input.val(amount);
            pm_input.trigger('keyup');
          },150);
        });
      });
      emit("retail.control_container.rendered",retail.button_container);
      offset.top += denomination_button_container.outerHeight() + 10;
      var cp_options = shared.element('div',{id: 'cp_options'},'',retail.control_panel);
      cp_options.html('');
      cp_options.css({position: 'relative','text-align':'right','width': '95%'});
      cp_options.offset({top: offset.top});
      cp_options.append('<hr/>');
      var new_css = {width: (cp_options.outerWidth() / 2) - 35,'display':'inline-block','padding': retail.config.control_panel.button_padding};
      var config_button = shared.element('div',{id: 'config_button',class: 'generic-button button-with-margin'},_t('Configure'),cp_options);
      config_button.on('click',retail.callbacks.on_config);
      config_button.css(new_css);
      var logout_button = shared.element('div',{id: 'logout_button',class: 'warning-button button-with-margin'},_t('Logout'),cp_options);
      logout_button.on('click',retail.callbacks.on_logout);
      logout_button.css(new_css);
      
    },
    categories: function (categories) {
      retail.button_container.html('');
      for (var key in categories) {
        var options = {};
        var category = categories[key];
        try {
          var color = to_rgb(category.c);
        } catch (err) {
          console.log(category, "threw error:",err);
          color = {red: 0, green: 0, blue: 0};
        }
        options.id = "pos_category_" + category.id;
        options.bgcolor = color.red + "," + color.green + "," + color.blue;
        options.bgimage = "assets/images/category_" + category.i + ".png";
        options.append_to = retail.button_container;
        options.data = {category: category};
        options.handlers = {
          click: function () {
            var category = _get('category',$(this));
            var target = shared.draw.dialog(category.n,'category_popup');
            shared.helpers.expand(target,0.50);
            shared.helpers.center(target);
            shared.helpers.position_rememberable(target);
            deletable(target);
            retail.active_popup = target;
            retail.draw.category_buttons(category,target);
          }
        };
        add_category_button(category.n,options);
      }
    },
    popup: function () {
    },
    category_buttons: function (category,target) {
      target.find('.category-item-button').remove();
      $.each(category.a, function (key,value) {
        var article = retail.database.articles[value];
        var button = create_dom_element('div',{class: 'category-item-button royal-button button-with-margin'},article.name,target);
        button.css({display: 'inline-block',width: button.parent().width() * 0.45, padding: retail.config.control_panel.button_padding});
        _set('article',article,button);
        button.on('click',function () {
          retail.utils.add_article(_get('article',$(this)).sku);
          if (retail.config.buttons.close_on_click) {
            retail.active_popup.remove();
          }
        });
      });
    },
    article_row: function (article) {
      /* At this point article is a reference to retail.orders.current().items[index] ..etc*/
      try { 
        var row = shared.element('tr',{id: 'article_' + article.id,'class': 'article-row'},'','');
        row.html('');
        if (article.hidden == true) {
          row.remove();
          return;
        } else {
          row.show();
        }
        _set('article',article,row);
        var name = create_dom_element('td',{class:'name'},retail.articles.find_by_id(article.id).name + ' ' + article.id,row);
        if (article.discounts.length > 0) {
          name.addClass('discounted');
        } else {
          name.removeClass('discounted');
        }
        if (article.rebate > 0) {
          name.addClass('rebate');
        } else {
          name.removeClass('rebate');
        }
        name.on('click',retail.callbacks.on_show_item_menu);
        var quantity = create_dom_element('td',{class:'quantity'},article.quantity,row);
        quantity.on('click', function () {
          var a = _get('article',$(this).parent());
          retail.utils.add_article(retail.articles.find_by_id(a.id).sku);
          retail.orders.update_totals();
        });
        var price = create_dom_element('td',{class:'price'},shared.math.to_currency(to_price(article.price)),row);
        var total = create_dom_element('td',{class:'total'},'',row);
        if (!_get('private.existed',row)) {
          retail.articles_container_table.prepend(row);
        } else {
          var t = row.parent();
          if (t.find('tr').length > 3) {
            //row.detach().insertBefore(t.find('tr:first'));
          }
          try {
              row.find('td').each(function () {
                var td = $(this);
                var old_css = {color: td.css('color'), 'background-color':td.css('background-color')};
                $(this).stop(true,true).animate({'background-color': '#773973','color': 'white'},200);
                setTimeout(function () {
                  td.css(old_css);
                },520);
            });
          } catch (err) {
            console.log('highlighting failed',err,err.stack);
          }
        }
        
        _set('private.existed',true,row);
        try {
          retail.orders.update_totals();
        } catch (err) {
          console.log("failed to update totals",err,err.stack);
        }
      } catch (err) {
        console.log("retail.draw.article_row failed",err,err.stack);
      }
    },
    change_dialog: function () {
      var dialog = shared.draw.dialog(_t('Change'),'change_dialog');
      dialog.show();
      shared.helpers.center(dialog);
      shared.helpers.shrink(dialog,0.30);
      shared.helpers.shrink(dialog,0.10,'vertical');
      shared.helpers.position_rememberable(dialog);
      deletable(dialog);
      var complete_button = create_dom_element('div',{class: 'ok-button'},"OK",dialog);
      shared.helpers.bottom_right(complete_button,dialog);
      complete_button.on('click',function () {
        dialog.hide();
      });
    },
    change: function (amount) {
      var dialog = $('#change_dialog');
      dialog.show();
      var change = retail.utils.calculate_change(retail.orders.current());
      var change_display = shared.element('div',{'id':'change_dialog_display'},'',dialog);
      change_display.html(shared.math.to_currency(change));
    }
  },
  /* 
   * 
   * These are misc utility functions that don't really fit anywhere else. 
   * 
   */
  utils: {
    get_new_article: function (article) {
      console.log('get_new_article');
      if (!article.quantity) {
        article.quantity = 0;
      }
      var ident = article.sku;
      if (retail.database.orders[retail.orders.index].items[ident]) {
        ident = ident + parseInt(Math.random() * 100000);
      }
      var a = {name: article.name,sku: article.sku, price: from_price(article.price), quantity: article.quantity,ident: ident, hidden: false};
      return a;
    },
    get_article: function (ident,article) {
      console.log('get_article');
      if (retail.database.orders[retail.orders.index].items[ident]) {
        var a = retail.database.orders[retail.orders.index].items[ident];
      } else {
        var a = retail.utils.get_new_article(article);
      }
      return a;
    },
    add_article: function (sku) {
      console.log('add_article',sku);
      var article = retail.database.articles[sku];
      var a = jQuery.extend(true,{},article);
      var item = retail.orders.get_item(a.sku);
      item.hidden = false;
      item.quantity = shared.math.to_float(item.quantity) + 1;
      retail.orders.save();
      retail.draw.article_row(item);
    },
    decrement_article: function (sku) {
      console.log('decrement_article',sku);
      a = retail.orders.get_item(sku);
      a.quantity -= 1;
      if (a.quantity <= 0 ) {
        a.hidden = true;
      }
      retail.orders.save();
      retail.draw.article_row(a);
      if (a.hidden == true) {
        retail.orders.update_totals();
        retail.callbacks.on_remove_item_menu();
      }
    },
    update_item: function (a) {
      retail.orders.save();
      var row = $('#article_' + a.id);
      if (row.length > 0) {
        _set('article',a,row); // i.e. we need to update the object attached to the row as well
      } else {
        console.log('row does not exist','#article_' + a.ident);
      }
    },
    /* Incremental search on articles to prevent long searches from blocking the UI. */
    perform_article_search: function (term,start,results) {
      console.log("Searching with term:" + term);
      if (!start)
        start = 0;
      if (!results)
        results = new Array();
      var time = new Date();
      var keys = Object.keys(retail.database.articles);
      for (var i = start; i < keys.length; i++) {
        var key = keys[i];
        var article = retail.database.articles[key];
        if (article.name.toLowerCase().indexOf(term.toLowerCase()) != -1) {
          results.push(article);
        }
        var now = new Date();
        if ((now - time) > 250) {
          console.log("setting up next job");
          setTimeout(function () {
            retail.utils.perform_article_search(term,i+1,results);
          },200);
          emit('retail.article_search.partial_result',results);
          return;
        }
      } 
      emit('retail.article_search.complete',results);
    }, // end of perform_article_search 
    
    calculate_change: function (o) {
      console.log('calculate_change called');
      var total = retail.orders.total(o);
      var pm_total = 0;
      console.log(total,pm_total);
      $.each($('.payment_method_row'),function (k,v) {
        var pm = _get('payment_method',$(v));
        console.log(pm);
        pm_total += shared.math.to_float(pm.amount);
      });
      var change = shared.math.round(pm_total - total,2);
      retail.orders.current().change = change;
      console.log('change is:',change,pm_total,total);
      return change;
    },
    db_merge: function (data,key) {
      if (!retail.database[key] instanceof Object)
        retail.database[key] = {}
      retail.database[key] = shared.helpers.merge(retail.database[key],data[key]);
      _set('retail.'+key+'_loaded',true);
    }
  },
  /* 
   * These functions are used primarily as callbacks for on('click' etc. Though sometimes
   * we want to call them directly as well.
   */
  callbacks: {
    format_search_result: function (result) {
      var value = result;
      var dialog = $(this);
      var btn = create_dom_element('div',{class: 'result result-name'},value.name,dialog);
      
      (function () {
        var a = value;
        btn.on('click',function () {
          retail.utils.add_article(a.sku);
        });
      })();
      create_dom_element('div',{class: 'result result-price'},shared.math.to_currency(value.price),dialog);
    },
    on_keyup: function(event) {
      if (event.keyCode == 13) {
        retail.callbacks.on_enter(event);
      }
    },
    on_login: function (pass) {
      console.log('on_login',pass);
      $.each(retail.database.users,function (k,v) {
        if (v.p == pass) {
          retail.user = v;
          retail.draw.interface();
          localStorage.setItem('retail.user',JSON.stringify(v));
        }
      });
    },
    on_logout: function () {
      console.log('on_logout');
      retail.user = null;
      retail.draw.hide_interface();
      localStorage.setItem('retail.user','undefined');
    },
    on_enter: function (event) {
      if (event.target.id == 'sku_input') {
        var sku = $('#sku_input').val();
        var article = retail.database.articles[sku];
        if (article) {
          retail.utils.add_article(article.sku);
          $('#sku_input').val('');
        } else {
          article = retail.database.articles[sku.toUpperCase()];
          if (article) {
            retail.utils.add_article(article.sku);
            $('#sku_input').val('');
          } else {
            $('#sku_input').val('');
            retail.utils.perform_article_search(sku);
          }
        }
      } else if ($(event.target).hasClass('login-input')) {
        retail.callbacks.on_login.call(event.target,$(event.target).val())
      }
    },
    on_window_resize: function () {
      retail.callbacks.on_remove_item_menu();
      _set('retail.dirty',true); /* This will cause the interface to completely redraw */
    },
    on_database_refresh: function (data) {
      console.log("Database Refresh");
      if (data.articles) {
        retail.utils.db_merge(data,'articles');
      }
      if (data.categories) {
        retail.utils.db_merge(data,'categories');
      }
      if (data.taxes) {
        retail.utils.db_merge(data,'taxes');
      }
      if (data.users) {
        retail.utils.db_merge(data,'users');
      }
      if (data.payment_methods) {
        retail.utils.db_merge(data,'payment_methods');
      }
      if (data.i18n) {
        retail.utils.db_merge(data,'i18n');
      }
      if (data.discounts) {
        retail.utils.db_merge(data,'discounts');
      }
      for (key in data) {
        _set('retail.'+key+'_loaded',true);
      }
      TaskManager.add('retail.save_database',retail.save_database,5,false,window); // this needs to be scheduled so that it isn't called too much.
    },
    on_show_item_menu: function () {
      retail.callbacks.on_remove_item_menu();
      var a = _get('article',$(this).parent());
      _set('retail.active_article',a);
      
      var offset = $(this).offset();
      offset.top -= 4;
      var div = create_dom_element('div',{id: 'item_menu'},$(this).html(),retail.container);
      _set('click_source',$(this),div);
      div.offset(offset);
      div.css({width: $(this).width() + 100, height: $(this).parent().height() + 4, 'z-index': 10});
      var div2 = create_dom_element('div',{id: 'item_menu_options'},'',retail.container);
      _set('click_source',$(this),div2);
      offset.top += div.height() + 2;
      _set('article',a,div2);
      div2.offset(offset);
      div2.css({width: retail.articles_container_table.width() - 5, 'z-index': 9});
      _set('article',a,div2);
      var plus_button = shared.helpers.to_inline_block(create_dom_element('div',{class:'add-button retail-item-menu-button'},'',div2));
      plus_button.css({'margin-left': 10});
      plus_button.on('click',function () {
        var a = _get('article',$(this).parent());
        retail.utils.add_article(retail.articles.find_by_id(a.id).sku);
      });
      var minus_button = shared.helpers.to_inline_block(create_dom_element('div',{class:'minus-button retail-item-menu-button'},'',div2));
      minus_button.on('click',function () {
        var a = _get('article',$(this).parent());
        retail.utils.decrement_article(retail.articles.find_by_id(a.id).sku);
      });
      var plus_minus_button = shared.helpers.to_inline_block(create_dom_element('div',{class:'plus-minus-button retail-item-menu-button'},'',div2));
      plus_minus_button.on('click',function () {
        var a = _get('article',$(this).parent());
        var new_price = shared.math.to_float(to_price(a.price)) * -1;
        a.price = from_price(new_price);
        _set('article',a,$(this));
        retail.draw.article_row(a);
      });
      var discount_button = shared.helpers.to_inline_block(create_dom_element('div',{class:'discounts-button retail-item-menu-button'},'',div2));
      _set('target',a,discount_button); // i.e. where to add the discount
      discount_button.on('click',retail.callbacks.on_show_discounts);
      deletable(div2,'right',function () {
        retail.callbacks.on_remove_item_menu();
      });
      div2.append('<br />');
      shared.draw.option(_t('Rebate'),div2,function () {
        var a = _get('article',div2);
        a.rebate = $(this).val();
        retail.utils.update_item(a);
        retail.draw.article_row(a);
      }, a.rebate);
      if (a.discounts && a.discounts.length > 0) {
        for (var i = 0; i < a.discounts.length;i++) {
          var d = retail.discounts.find_by_id(a.discounts[i].id);
          var div = shared.element('div',{id: 'item_menu_discount' + d.id,class: 'item-menu-discount generic-button button-with-margin'},d.n + ' ' + shared.math.to_percent(d.a),div2);
          _set('discount',a.discounts[i],div);
          deletable(div,function () {
                          // ensures it will be a reference
            var article = _get('article',$(this).parent().parent());
            var discount = _get('discount',$(this).parent());
            retail.orders.remove_discount(article,discount);
            $(this).parent().remove();
            $('.item-menu-discount').each(function () {
              deletable($(this));
            });
            retail.draw.article_row(article);
            TaskManager.add('retail.save_database',retail.save_database,5,false,window); // this needs to be scheduled so that it isn't called too
          });
        }
      }
    },
    on_remove_item_menu: function () {
      $('#item_menu').remove();
      $('#item_menu_options').remove();
    },
    on_complete_order: function () {
      console.log('on_complete_order');
      retail.callbacks.on_remove_item_menu();
      $('#order_options_dialog').remove();
      var dialog = shared.draw.dialog(_t('Complete Order'),'complete_order_dialog');
      dialog.show();
      shared.helpers.expand(dialog,0.10);
      shared.helpers.expand(dialog,0.15,'vertical');
      shared.helpers.center(dialog,$(window));
      deletable(dialog); // we call this a second time to move the del button
      shared.helpers.position_rememberable(dialog);
      if (!_get('existed',dialog)) {
        add_button_menu(dialog);
        var add_pm_button = shared.create.plus_button(function () {
          add_payment_method2($(this).parent().parent());
        });
        add_menu_button(dialog,add_pm_button);
        add_pm_button.trigger('click');
        var complete_button = shared.element('div',{class: 'ok-button'},"OK",dialog);
        shared.helpers.bottom_right(complete_button,dialog);
        complete_button.on('click',function () {
          try {
            retail.orders.complete(retail.orders.index);
          } catch (err) {
            console.log(err);
          }
          $('#order_total').html(shared.math.to_currency(0));
          dialog.hide();
        });
      }
      setTimeout(function () {
        var pm = dialog.find( '.payment-method-amount:first' );
        pm.val( shared.math.to_float( $('#order_total').html() ) );
        pm.trigger('keyup');
        
      },65);
      retail.draw.change_dialog();
    },
    on_article_search_result: function (event) {
      console.log('received results',event);
      var dialog = shared.draw.dialog(_t('Search Results'),'search_results');
      shared.helpers.center(dialog,$(window));
      shared.helpers.expand(dialog,0.40,'vertical');
      shared.helpers.shrink(dialog,0.30,'horizontal');
      shared.helpers.position_rememberable(dialog);
      deletable(dialog);
      _set('results',event.packet,dialog);
      _set('start',0,dialog);
      shared.helpers.paginator(dialog,retail.callbacks.format_search_result);
    },
    on_config: function () {
      console.log('on_config');
      var dialog = shared.draw.dialog(_t('Configure'),'config_dialog',true);
      dialog.show();
      shared.helpers.center(dialog,$(window));
      shared.helpers.expand(dialog,0.40);
      shared.helpers.expand(dialog,0.20,'vertical');
      shared.helpers.position_rememberable(dialog);
      deletable(dialog,function () {
        console.log('doing');
        dialog.remove();
        TaskManager.add('retail.save_database',retail.save_database,5,false,window); // this needs to be scheduled so that it isn't called too
      });
      dialog.append('<h3>'+_t('Refresh Databases')+'<h3>');
      var refresh_db_button_row = shared.element('div',{id: 'refresh_db_button_row'},'',dialog);
      var new_css = {width: refresh_db_button_row.outerWidth() / 4, 'font-size': '110%',padding: '5px',height: '25px',display: 'inline-block'};
      
      function create_refresh_button(text,id) {
        var refresh_db_button = shared.element('div',{id: id,class:'royal-button button-with-margin'},text,refresh_db_button_row);
        refresh_db_button.css(new_css);
        return refresh_db_button;
      }
      create_refresh_button(_t('Translations'),'refresh_i18n_button').on('click',function () {
        _fetch('/retail/i18n_database',retail.callbacks.on_database_refresh);
      });
      
      create_refresh_button(_t('Payment Methods'),'refresh_pm_button').on('click',function () {
        _fetch('/payment_methods/json_database',retail.callbacks.on_database_refresh);
      });
      
      create_refresh_button(_t('Categories'),'refresh_categories_button').on('click',function () {
        _fetch('/categories/json_database',retail.callbacks.on_database_refresh);
      });
      
      refresh_db_button_row.append('<br />');
      
      create_refresh_button(_t('Users'),'refresh_users_button').on('click',function () {
        _fetch('/users/json_database',retail.callbacks.on_database_refresh);
      });
      
      create_refresh_button(_t('Taxes'),'refresh_taxes_button').on('click',function () {
        _fetch('/taxes/json_database',retail.callbacks.on_database_refresh);
      });
      
      create_refresh_button(_t('Discounts'),'refresh_discounts_button').on('click',function () {
        _fetch('/discounts/json_database',retail.callbacks.on_database_refresh);
      });
      
      dialog.append('<h3>'+_t('General')+'<h3>');
      var general_row = shared.element('div',{id: 'general_button_row'},'',dialog);
      var conc = shared.draw.check_option(_t('Close on click'),general_row,function () {
        retail.config.buttons.close_on_click = $(this).is(":checked");
      }, retail.config.buttons.close_on_click);
      var bp_opt = shared.draw.option(_t('Button Padding'),general_row,function () {
        if (retail.config.control_panel.button_padding != $(this).val()) {
          retail.config.control_panel.button_padding = $(this).val();
          _set('retail.dirty',true);
        }
      },retail.config.control_panel.button_padding);
      var fbp_opt = shared.draw.option(_t('Finish Button Padding'),general_row,function () {
        if (retail.config.control_panel.finish_button_padding != $(this).val()) {
          retail.config.control_panel.finish_button_padding = $(this).val();
          _set('retail.dirty',true);
        }
      },retail.config.control_panel.finish_button_padding);
      shared.helpers.align(bp_opt.find('.option-name'),fbp_opt.find('.option-name'),bp_opt,fbp_opt);
      shared.helpers.align(conc.find('.option-name'),fbp_opt.find('.option-name'),conc,fbp_opt);
      
      var de_opt = shared.draw.option(_t('Denominations'),general_row,function () {
        if (retail.config.control_panel.denominations != $(this).val()) {
          retail.config.control_panel.denominations = $(this).val();
        }
      },retail.config.control_panel.denominations);
      shared.helpers.align(de_opt.find('.option-name'),fbp_opt.find('.option-name'),de_opt,fbp_opt);
      de_opt.find('.option-actual-input').css({width: (general_row.width() - de_opt.find('.option-name').width()) * 0.70});
      shared.helpers.shrink(de_opt,0.10,'horizontal');
      
      var bh_opt = shared.draw.option(_t('Buttons Height'),general_row,function () {
        if (retail.config.buttons.height != $(this).val()) {
          retail.config.buttons.height = $(this).val();
          _set('retail.dirty',true);
        }
      },retail.config.buttons.height);
      shared.helpers.align(bh_opt.find('.option-name'),fbp_opt.find('.option-name'),bh_opt,fbp_opt);
    },
    on_show_discounts: function () {
      var target_object = _get('target',$(this));
      console.log(target_object);
      var dialog = shared.draw.dialog(_t("Discounts"),'choose_discount_dialog');
      shared.helpers.center(dialog);
      shared.helpers.expand(dialog,0.20);
      shared.helpers.expand(dialog,0.10,'vertical');
      shared.helpers.position_rememberable(dialog);
      deletable(dialog);
      var results = [];
      $.each(retail.database.discounts, function (k,v) { results.push(v);});
      _set('results',results,dialog);
      _set('page_size',3,dialog);
      shared.helpers.paginator(dialog,function (result) {
        var d = result;
        var dialog = $(this);
        var add = shared.element('div',{id: 'discounts_dialog_discount' + d.id,class: 'result discount-result button-with-margin'},d.n ,dialog);
        add.on('click',function () {
          if (!retail.orders.has_discount(target_object,d)) {
            target_object.discounts.push(retail.discounts.copy(d));
            retail.orders.update_totals();
            if ($('#item_menu_options').is(":visible")) {
              _get('click_source',$('#item_menu_options')).trigger('click');
              retail.draw.article_row(_get('retail.active_article'));
            }
            if ($('#order_options_dialog').is(":visible")) {
              $('#order_total').trigger('click');
            }
          } else {
            console.log('object already has discount',d);
          }
        });
        shared.element('div',{id: 'discounts_dialog_discount_perc_' + d.id,class: 'result discount-result-perc button-with-margin'},shared.math.to_percent(d.a),dialog);
      });
    }
  }
}