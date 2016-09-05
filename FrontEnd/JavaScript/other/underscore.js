//     Underscore.js 1.8.2
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  // root也就浏览器中的默认对象window
  var root = this;

  // Save the previous value of the `_` variable.
  // 保存先前_所储存的内容
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  // 自实现原型继承时会用到的参数
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.

  //_有两个功能
  //1. 支持对象式调用方法：作为构造函数 ，传入一个对象参数，包装在_的实例中 ，返回_的实例 （各种函数，会用mixin扩展到 _ 的原型上）
  //2. 支持函数式式调用方法：作为一个函数对象，为下面的各方法提供一个面向对象的调用方式
  var _ = function(obj) {
    //如果是_的实例直接返回
    if (obj instanceof _) return obj;
    // this不是_的实例：  链式调用的第一环，需要创建一个 _ 对象
    // this是_的实例： 如果 _ 作为 new _() 被调用时，由于构造函数的特性 this指向_ , 不会通过条件，
    // 也就不会造成死循环，执行 this._wrapped = obj; 语句， 将传入对象参数放在 _wrapped属性上
    if (!(this instanceof _)) return new _(obj);
    //等价于 else this._wrapped = obj;
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.

  //underscore.js在Node中代码
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.2';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.

  //返回高效回调函数
  //仅当 iteratee 为一个函数时，才使用 optimazedCb
  //由于各个underscore方法的功能不一样，接受的参数不一样，所以给underscore方法匹配一个高效的的iteratee函数
  //参数传多了浪费，传少了不够，所以给每个 underscore方法自己选择的机会
  //相当于iteratee的一个代理，控制iterateed的参数
  var optimizeCb = function(func, context, argCount) { //iteratee ，iteratee的上下文，iteratee函数接受的参数个数（在this被劫持时，可以发挥作用，比如事件中）
    // 注意：context参数可以传null，意味着在window环境中调用. === 是区分null和undefined的
    if (context === void 0) return func;//func的this,指向underscore   //1.context === viod 0 意味着只有一个参数 2.void 0 避免undefined被覆盖
    switch (argCount == null ? 3 : argCount) { //不传argCount参数，iteratee函数默认接受三个参数
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) { //值， 索引， 集合
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) { //acumulator 累计值，也就是原生map中的pre
        return func.call(context, accumulator, value, index, collection);
      };
    }

    // 如果传入的第三个参数不是期望几种值，不使用明确的参数，直接将arguments传入，有func内部自行调用
    // _.iteratee() 函数使用此方法
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.

  //返回回调函数
  //iteratee可能为多种形式时，用cb作为 iteratee 的代理
  //underscore中多数函数为高阶函数  做 —— 怎么做（传入参数） —— 结果
  var cb = function(value, context, argCount) { //value 即为传入的 iteratee
    if (value == null) return _.identity;  // 当没传入 iteratee 时，iteratee的功能是 返回出入iteratee的首个参数.
    if (_.isFunction(value)) return optimizeCb(value, context, argCount); // 当value为函数时，调用optimizedCb
    if (_.isObject(value)) return _.matcher(value); //如果value是对象，value的具有的全部键对值（自身可枚举的），obj也包含，则返回true，否则false
    return _.property(value); //当 value 为一个基本类型时，iteratee的功能是 取obj[value]的属性值
  };

  //创建一个迭代器，绑定了context，使用optimizeCb的默认情况
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.

  //内部函数,用于创建一个分配器
  //两个参数。1.取属性的规则 2.追加规则
  //（一直函数式的思想，利用高阶函数实现    做——怎么做——结果）
  //返回被追加属性后的obj
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      // 防御性代码，对null取属性会抛出错误
      // if (!obj) return obj 也可以
      if (length < 2 || obj == null) return obj; // 仅一个参数或没有参数时，原样返回
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),//keyFunc接受的是object参数
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          // undefinedOnly 为false时，全部追加，会覆盖原属性
          // undefinedOnly 为true 时，只复制原对象中没有的对象
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.

  //内部函数
  //原型继承prototype参数
  //返回一个新对象
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    // Object.create = nativeCreate 原型继承
    // 自己的想法 nativeCreate.call(this, prototype)
    // 所以的对象都是是继承自Object对象
    if (nativeCreate) return nativeCreate(prototype);
    // 自实现原型继承
    Ctor.prototype = prototype;
    var result = new Ctor;
    // 使用后将Ctor重置
    Ctor.prototype = null;
    return result;
    // 另一种设置原型的方法
    //function object(o){
    //  function F(){}
    //  var result = new F()
    //  result.prototype = o;
    //  console.log(F.prototype) //a
    //  F.prototype = null
    //  console.log(F.prototype) //null
    //}
    //var a = {
    //  name: 123
    //}
    //object(a)
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength

  // JavaScript中的的最大数
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

  // 数组和类数组都会返回true
  // 字符串也会返回true
  var isArrayLike = function(collection) {
    var length = collection != null && collection.length;
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  //
  _.each = _.forEach = function(obj, iteratee, context) {
    //用cb没什么意义，都可以用其他组合代替
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.

  // 自实现
  // 虽然代码少，但是总体上多了一次循环
  //_.map = function (obj, iteratee, context) {
  //  iteratee = cb(iteratee, context)
  //  var array = isArrayLike(obj) ? obj : _.values(obj)
  //  for (var i = 0, len = array.length, rel = []; i < len; i++) {
  //    rel.push(iteratee(array[i], i, array))
  //  }
  //  return rel
  //}

  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    // 将 && 当做先决条件用， || 当做后补选项用
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };





  // Create a reducing function iterating left or right.

  //因为有方向的问题，所以不能用each
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    // 将独立的功能，分成单独的函数
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        //直接跳过第一次循环
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.

  // 查找符合预期的 索引或key, 返回其属性值

  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context); //没有返回 -1
    } else {
      key = _.findKey(obj, predicate, context); // 没有返回 void 0
    }
    // 如果未查找到返回undefined
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  // 如果predicate返回false，则立即退出
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      // 观察， every 和 some 此处的结构
      // 规律： 特殊情况提前退出，特殊情况不是返回false的情形，而是发生概率比较小的情况
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  // 如果predicate返回true，则立即退出
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `includes` and `include`.

  //
  //判断 是否 在obj的自己拥有可枚举的的值中 包含 target属性值
  _.contains = _.includes = _.include = function(obj, target, fromIndex) {// target为一属性值
    if (!isArrayLike(obj)) obj = _.values(obj);// 将对象的值 数组化
    return _.indexOf(obj, target, typeof fromIndex == 'number' && fromIndex) >= 0;// fromIndex可以为0 但传不传就没意义了
  };

  // Invoke a method (with arguments) on every item in a collection.

  // call的map形式
  // 借用一个对象的环境调用一个函数（方法）
  // 调用obj的每个元素上的method方法（现定义一个函数亦可以）
  // args第二个参数之后，都是要传给method的的方法
  // method如果是字符串，则调用对象上的方法
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      // 自定义或者取用对象上的方法
      var func = isFunc ? method : value[method];
      // 如果被借用的对象的方法不存在， func = undefined，会返回undefined
      // 在这个对象的环境内调用这个方法
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.

  // 获取每个元素的key属性
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.

  // 对 集合 中元素与 attrs 对象进行比较
  // 返回匹配的集合.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.

  // 对 集合 中元素与 attrs 对象进行比较
  // 返回匹配的第一个元素
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;

    // 如果iteratee为空 ，用else 的部分也可以。computed和result的是一致的
    // 但是由于else中操作的是computed 和 result两个变量，效率不如一个高
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }


    } else {
      // 比较的是经过函数计算后的值
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        //等价于 computed > lastComputed || (computed === -Infinity && result === -Infinity)
        //进入条件的两种情况
        // 1. 大于上一个计算值
        // 2. 特殊情况
        // computed === -Infinity && result === -Infinity
        // 当computed的值和初始值一样的话，并且result还是初始值的话
        // 无论什么值都要把值赋给result，因为这个值只能大于等于Infinity
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).

  // JavaScript特点的一种乱序算法，但是会随着数组长度的增加，随机性变差
  //function shuffle (array) {
  //  return array.sort(function(){
  //    return Math.random() - 0.5
  //  })
  //}

  //Fisher-Yates shuffle算法
  //function ___shuffle (array) {
  //  var n = array.length
  //  var t, i
  //  while (n) {
  //   // n = max - min + 1 = (array.length - 1) - 0 + 1
  //    i = Math.floor(Math.random() * n--)
  //    //恰恰 n-- 之后 n 为数组最后一个索引
  //    //把随机后的元素归置到数组末尾
  //    t = array[n]
  //    array[n] = array[i]
  //    array[i] = t
  //  }
  //  return array
  //}


//返回一个新数组的Fisher-Yates乱序算法
//给新数组赋值的同时乱序操作
//???待深入理解
  _.shuffle = function(obj) {
    //??? 使用了关键字
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      //随着数组长度的增加， 进入条件的可能性越大，也就会执行越多的改变元素的位置的操作
      if (rand !== index) shuffled[index] = shuffled[rand];
      //取值顺序是一定的，赋给的位置是不一定的
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.

  // guard参数可以使函数与map函数组合使用
  // 随机抽取n个值
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];  // 返回一个随机值
    }
    // 当数组的索引是变量的时候，用一个极限值兜底，防止索引出界
    return _.shuffle(obj).slice(0, Math.max(0, n))// 排除n为负数的情况
  };

  // Sort the object's values by a criterion produced by an iteratee.
  // 对集合的每个元素应用 iteratee 函数，根据返回值再按大小进行排序 （sort 集合 by 返回值）
  // 按顺序排序后的集合
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      // 按criteria从小到大排序
      var a = left.criteria;
      var b = right.criteria;
      //有undefined时，比较运算符总是返回false,排除两个值都是undefined的情况
      if (a !== b) {
        //???不清楚， 具体算法不清楚
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      //如果计算值相等，则按照index 从小到大排序
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.

  // 内部函数
  // 高阶函数，将计算结果传给behavior
  // behavior 为一个函数，用于 对 元素经过iteratee函数的返回值 进行操作
  // 加过后的函数返回一个数组
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.

  // 将元素分组 by 计算结果
  _.groupBy = group(function(result, value, key) {
    //使用has  而不是直接检查存在性， 避免了与原型属性名相同产生的冲突
    if (_.has(result, key)) result[key].push(value);
    else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.

  // 创建索引 by 计算结果
  // 如果计算结果相同，会覆盖之前的值
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.


  // count 元素个数 by 相等的计算结果
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++;
    else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.

  //期待四种情况
  //obj: 1.空  2.数组 3.类数组 4.对象
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    // _.values() 只能用于对象
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.

  // first last initial rest 总结
  //                     n正向取  n逆向取
  // 取切分点之前的部分：first    initial
  // 取切分点之后的部分：rest     last

  // 取数组前n个元素
  // var a = [ [1, 2, 3], [4, 5, 6] ];
  // put this array though _.map and _.first
  // _.map(a, _.first); // [1, 4]
  // 第三个参数保证在于map组合使用时  guard的恰好为array参数 能实现取第一个元素的功能，而不会因为index的变换取值数量发生变化
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    // 等于slice(0,array.length -  array.length + n)
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.

  //取剔除后n个元素，取前面的元素
  _.initial = function(array, n, guard) {
    // max中用0兜底
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.

  //取数组后n个元素 （n = 1时，表示取倒数第一个）
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.

  // 剔除前n个元素，取后面的数组
  // 默认是剔除第一个
  _.rest = _.tail = _.drop = function(array, n, guard) {// 取切分的后部分
    return slice.call(array, n == null || guard ? 1 : n);
  };

  //自实现 fist last initial rest 可读性更好
  //_.initial = function(array, n, guard) {
  //  if (n == null || guard) {
  //    n = array.length - 1
  //  }
  //  n = array.length - n
  //  return Array.prototype.slice.call(array, 0, n)
  //}
  //
  //_.first = function(array, n, guard) {
  //  if (n == null || guard) {
  //    n = 1
  //  }
  //  return Array.prototype.slice.call(array, 0, n)
  //}
  //
  //_.last = function(array, n, guard) {
  //  if (n == null || guard) {
  //    n = array.length - 1
  //  }
  //  n = array.length - n
  //  return Array.prototype.slice.call(array, n)
  //}
  //
  //_.rest = function(array, n, guard) {
  //  if (n == null || guard) {
  //    n = 1
  //  }
  //  return Array.prototype.slice.call(n)
  //}

  // Trim out all falsy values from an array.
  // 压缩稀疏的数组
  // if(false, null, 0, "", undefined 和 NaN )都会返回false
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.

  // 内部函数
  // 用于展开数组
  // shallow 控制是否是深度 迭代
  // 譬如 数组 a=[1,2,[2,3,[1,2]]]
  // shallow=true的情况 (只打开一层)
  // flatten之后的结果为 [1,2,2,3,[1,2]]
  // shallow=false的情况
  // flatten[1,2,2,3,1,2] （递归全部打开）
  //strict参数的作用是
  //当strict为false的时候，非arguments或数组的值，作为一个值添加到新数组中，不会展开
  //当 strict 为true时，非arguments或数组的值，不会被添加到新数组中
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = input && input.length; i < length; i++) {
      var value = input[i];
      // 如果value是数组或argument可以继续递归展开
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        // 递归要符合两层的条件 1.数组 2.shallow
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          // idx记录数组最后的位置
          // ??? push 和 array[i]的效率问题
          // 用push也可以
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).

  // 创建一个数组, 该数组排除了所提供的其他参数,
  // 与 difference 类似
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.

  //创建一个数组副本,并对计算后的结果进行等值比较, 只有首次出现的元素才会被保留.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    // isSorted是可选参数，当没传入此参数的时候，调整参数列表
    if (!_.isBoolean(isSorted)) {
      //改变参数意义时，要注意赋值的先后顺序，先给undefined的值赋值
      context = iteratee;
      iteratee = isSorted;
      //isSorted的默认值
      isSorted = false;
    }
    // 不直接使用identity，效率不高
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        // 由于数组已经排序了，只需判断是否和上次计算的结果不一样（不能判断value是否重复，不同的value可能产生相同的computed，例如二次函数）
        // 第一个元素不用判断是否重复,必然通过条件判断
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.

  //将各个数组参数合并一起后，再去重
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.

  // 交叉点
  // 取各个数组参数都包含的元素组成的数组
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    // 遍历元素
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      //先检查是否是重复的交叉点
      if (_.contains(result, item)) continue;
      // 遍历各个参数， 判断是否都包含
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      // j === argsLength 说明都包含这个元素
      if (j === argsLength) result.push(item);
    }
    return result;
  };
  // 自实现，可读性更强/‘；【
  //var intersection = function(array) {
  //  var rel = []
  //  if (!array) return void 0
  //  Array.prototype.unshift(arguments)
  //  for (var i = 0, len = array.length; i < len; i++) {
  //    var item = array[i]
  //    if (_.contains(rel, item)) continue
  //    var everyRel = _.every(arguments, function(value){
  //      return _.contains(value, item)
  //    })
  //    if (everyRel) rel.push(item)
  //  }
  //  return rel
  //}
  //console.log(intersection([1,1,2,3],[3,1,6,4],[7,8,1,3]))


  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.

  //创建一个去重差异 数组, 该数组排除了所提供的其他数组的元素,
  _.difference = function(array) {
    // 其他参数也必须是数组，否则忽略
    // 参数数组浅展开
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };


  //测试代码
//var temp = _.zip(['fred', 'barney'], [30, 40], [true, false])
//console.log(['fred', 'barney'], [30, 40], [true, false])
//console.log(temp)
//console.log(_.unzip(temp))

//["fred", "barney"] [30, 40] [true, false]
//[Array[3], Array[3]]
//[Array[2], Array[2], Array[2]]
// zip 和 unzip 的关系是
//原：["fred", "barney"] [30, 40] [true, false]
//zip的返回：[Array[3], Array[3]]
//unzip的返回：[Array[2], Array[2], Array[2]]  （等价于 [原] ）
// unzip 与 zip 算法一样，仅接受的参数形式不同，参数的本质是一样的
// 不同：接受一个数组参数
// 相同：传入数组的元素长度决定返回数组元素个数

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    //接受多个参数， 将多个参数作为一个参数，传给 unzip
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, 'length').length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.

  // 将数组对象化，两种传参方法
  //_.object([['fred', 30], ['barney', 40]]);
  //// => { 'fred': 30, 'barney': 40 }
  //
  //_.object(['fred', 'barney'], [30, 40]);
  //// => { 'fred': 30, 'barney': 40 }
  _.object = function(list, values) {
    var result = {};
    //把变量当做数组或对象使用时，为防止变量为空的情况而引起的错误，先检查存在性 list && list.length
    for (var i = 0, length = list && list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.

  //在array中检索item的位置（从先向后）
  //当array已经被排序时，可以传入 isSorted参数
  //isSorted为检索的起始位置（默认起始位置为0），并且使用二分法查找
  // isSorted正向取索引是[0,length-1]
  // 负向取索引是[-legth,-1]
  //当isSorted为负数时。例如 -3 ，代表倒数第三个数为起始位置,并且使用二分法查找
  //当传入的是true时，则从 0 位置，使用二分法查找
  _.indexOf = function(array, item, isSorted) {

    //自实现，错误
    //if (typeof isSorted === "number" && isSorted < 0) {
    //  var length = array.length
    //  var start = length + isSorted
    //} else if (isSorted === true){
    //  var index = _.sortedIndex(array, item)
    //  if (array[index] === item) return index
    //} else {
    //  start = isSorted
    //}

    //错误纠正
    //第一点
    //var i = 0
    //定义变量要在普通情况，所以先普通情况，后特殊情况.因为特殊情况需要在使用之前的变量
    //第二点
    //if的嵌套的逻辑，如果不能用一个表达式改写，不要拆分开 (自实现不仅拆分错误了，而且逻辑也错误了)
    //例如此种情况， 不要拆分
    //if () {
    //  if () {}
    //  else{}
    //}
    var i = 0, length = array && array.length;
    if (typeof isSorted == 'number') {
    // issorted为负数时 取倒数的位置(倒数的顺序是-1，-2 .....)。 倒数第几位 + 总长度数 = 正向的索引（从0开始）
    // 从左向右查，左侧有明确的最小值，所以用 0 位置垫底
      i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
    } else if (isSorted && length) {
      i = _.sortedIndex(array, item); // 查找item应该插入的位置
      return array[i] === item ? i : -1; // 如果array中存在于item相等的值，则返回i，没有则-1
    }
    //NaN的特性是 NaN不与任何值相等
    //由于之后，会在遍历 ===比较， 所以先去除特殊情况
    if (item !== item) {
      return _.findIndex(slice.call(array, i), _.isNaN);
    }
    //普通情况的查找  遍历比较
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  //从后向前检索
  //form 和 indexOf代表的意义完全一样，只是这个函数时从后向前索引的
  _.lastIndexOf = function(array, item, from) {

    //完美改写

    //var index = array ? array.length : 0
    //需要检查，如果为index为undefined的话，后面的运算会出现NaN
    //var index = array && array.length
    //if (typeof from === "number") {
    //  index = from < 0 ? index + from : Math.min(index, from)
    //}
    //if (item !== item) {
    //  return _.findLastIndex(slice.call(array, 0, index + 1), isNaN)
    //}
    //for (;index >= 0; index--) {
    //  if (array[idx] === item) return index
    //}
    //return -1

    var idx = array ? array.length : 0;
    if (typeof from == 'number') {
      // 从右向左查，右侧有明确的最大值，用 idx 垫底
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    if (item !== item) {
      return _.findLastIndex(slice.call(array, 0, idx), _.isNaN);
    }
    //--idx,因为idx索引超出了数组索引非范围
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generator function to create the findIndex and findLastIndex functions

  // 内部函数
  // 是 findIndex 和 findLastIndex 的基础部分
  function createIndexFinder(dir) {//dir 为direction,正向为1，负向为-1
    return function(array, predicate, context) {
      //例如不传断言，可以用来检测是不是undefined
      //传 谓词函数。可以。。。。。。
      predicate = cb(predicate, context);
      //由方向的不同，设置不同的起始数值
      var length = array != null && array.length;
      //无论从哪个方向上递进，index都满足如下的条件
      //dir正向为1，负向为-1
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test

  // 与indexOf功能类似， indexOf传入的是一个值，本函数传入的是一个断言
  // 同时也是indexOf 和 find 的组成部分
  _.findIndex = createIndexFinder(1);

  _.findLastIndex = createIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.

  //二分法 查找插入位置
  //使用二进制检索方式来判断 value 应该插入在数组中的位置,它的索引应该尽可能的最低以保证数组的排序
  //注意：多个位置与value相等时，返回多个位置中索引最小的位置
  //      没有相等的位置时，返回较大的位置， 例如[3,5] value = 4, 返回的是 1
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1); // iteratee只能传入一个参数
    var value = iteratee(obj); // obj为待测值， value为待测值经过iteratee后的返回值
    var low = 0, high = array.length;
    // 对二进制的解释

    // 自变量取值范围中 low，high为两端值。 obj 为某一个点的变量
    // mid = Math.floor((low + high) / 2)   由于数组的索引也就是自变量取值范围由离散点组成，
    // 并且二分法是一种思想，ceil,floor，再经过对 low high的调整，功能上是等价的
    // 两种方法都保证了所有值都不会被遗漏
    // ceil在数轴上向右取一位，当value值在mid左侧时，将high向左取一位,补回来
    // floor在数组上向左去一个，当value值在mid右侧右侧时，将low向右一位，补回来
    // floor最后low+1=high, ceil最后 low = high
    // 两个方法的返回值本质上都是 return mid + 1 , 单不能直接返回 high , ceil时，最后逼近时，low = high
    while (low < high) {
      var mid = Math.floor((low + high) / 2); // 取中间值，作为数组的索引
      if (iteratee(array[mid]) < value) low = mid + 1; //将在数组中取到的值传入iteratee中，再与value比较. 如果 iteratee(array[mid]) === value，high不变，low不断趋近于high
      else high = mid;//取值比较
    }
    return low;  // return mid + 1
    //等价于
    //while (low < high) {
    //  var mid = Math.ceil((low + high) / 2); // 取中间值，作为数组的索引
    //  if (iteratee(array[mid]) < value) low = mid; //将在数组中取到的值传入iteratee中，再与value比较
    //  else high = mid - 1;//取值比较
    //}
    //return mid + 1
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).

  //生成一个以step为间隔start到stop之内的数字数组
  //返回的数组  [start,stop)
  //二个参数时 step默认1 一个参数时 step默认为1， start默认为0
  //返回的数组中的最后一个元素是小于stop且是step的整数倍的值，
  //例如_.range(start, start + 2.5 * step, step)
  //有(stop - start) / step)等于2.5倍, 返回的数组有3个区间 [start, start + step，start + 2 * step]

  // 只适用于已知步长，。 不适用于已知子数组的个数，需要另写函数
  // 例如  起始， 终止，数组个数。 （最后一个值可能略小于stop） [start,stop)
  //var range = function ( start, stop, number ) {
  //  step = Math.floor( ( stop - start ) / (number - 1) )
  //  var relList = []
  //  for (var i = 0; i < number; i++ ) {
  //    relList[i] = step * i
  //  }
  //  return relList
  //}
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    //二个参数时 step默认1
    step = step || 1;
    // ceil 等价于 floor + 1 的用法
    // max中用0兜底，防止出现负数
    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);
    for (var idx = 0; idx < length; idx++) {
      // 先赋值，后迭代，第一个元素就是初始值
      range[idx] = start;
      start += step
    }
    return range;
    //var length = Math.max(Math.floor((stop - start) / step), 0);
    //var len = length + 1
    //var rel = new Array(len)
    //for (var i = 0; i < len; i++, start += step){
    //  rel[i] = start
    //}
    //return rel
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments

  //内部函数，是bind，partial等函数的返回函数的内部功能 实际绑定上下文，参数并调用的函数
  //bind，partial等函数的功能时调整参数传给executeBound
  //源函数， ，绑定context, 此时的this，参数
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    // 如果this不是boundFunc的实例，返回源函数在传入context的调用结果
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    //??? 进入条件？？？？
    //原型继承源函数
    var self = baseCreate(sourceFunc.prototype);
    //在原型上引用源函数，并调用
    var result = sourceFunc.apply(self, args);
    // ???
    // 返回self估计是保持调用链的完整
    // 如果结果是对象， 则返回此对象。否则的话，返回源函数的原型
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    //如果原生函数存在，把参数传给原生的方法
    //if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    //出入给函数的参数
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.

  //创建一个函数，该函数调用 func 并传递 部分 预置参数到被调用的方法中. 该方法类似于 _.bind 只不过 它不修改 this 绑定
  // _ , 可以作为部分参数的占位符. 使用占位符的优势在于，函数参数顺序不会因为偏应用导致传参顺序发生变化而去调整
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    //通过闭包引用partial的参数
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        //如果partial()中传入的参数包含占位符，返回函数的参数按顺序依次替换占位符
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      //将返回函数的剩余参数接到参数数组的末尾
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.

  //绑定对象中的多个方法到对象中，方法以字符串形式传入
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.

  // memoize是一个高阶函数
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      //将address索引字符串化
      //如果hasher,则以hasher返回值作为key
      //如果hasher不存在，则把第一个参数作为key,所以第一个参数要有可区分性
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.

//函数节流
//“过滤处理”
//创建并返回一个像节流阀一样的函数，当重复触发函数的时候，至少每隔 wait毫秒调用一次该函数

//函数大部分都在模拟settimeout的功能  ，但比settimeout嵌套优势的部分是
// 存疑   //默认情况是  第一次触发立即调用然后建立延迟窗口间隔，间隔内第二次触发建立延迟函数, 延迟函数存在的话，再触发无效。
          //leading!==false  第一次触发开始函数延迟, 延迟函数存在的话，再触发无效  等价于setTimeout的嵌套
          //trailing===false 第一次触发立即调用然后建立延迟窗口间隔，间隔内再触发无效
          //trailing===false leading===false  第一次触发无效，建立延时窗口间隔，间隔内第二次触发并立即调用，再调用无效

//及时模式
//
//  {leading:true,trailing:false} 对应“及时执行模式”，也就是说function每次被调用到的时候，都是立即执行的。function的调用跟rtnFun的调用是顺序同步的。
//
//延时模式
//
//  {leading:false,trailing:true} 对应“延时执行模式”，也就是说function每次被调用到的时候，其实都是通过setTimeout执行的，function的调用跟rtnFun的调用是异步的。
//
//全关模式
//
//  {leading:false,trailing:false} 这种都关闭的情况，存在不合理的地方。
//
//在第一批次重复调用rtnFun时(wait时间段内)，function一次都不会被调用。比如说，新打开的页面上有个按钮，你快速点了几下，结果什么也没触发，过了一会儿，你再点下，才有函数被触发，这显然是个Bug。
//
//全开模式
//
//  {leading:true,trailing:true} 这种都开启的情况，也存在不合理的地方。
//
//重复调用rtnFun时(wait时间段内)，function经常被触发两次(两次时间间隔大于等于wait)，一次是“及时执行模式”的调用，另一次是“延时执行模式”，尽管function这两次调用的时间间隔大于等于wait。一般情况下，这并不是我们想要的结果，我们只想function被调用一次。
  _.throttle = function(func, wait, options) {
    var context, args, result
    var timeout = null
    // 上次执行时间点
    var previous = 0
    if(!options)  options = {}
    //延迟执行函数
    var later = function () {
      //options.leading === false 每一个间隔都重置， !false时，不重置zhi
      previous = options.leading === false ? 0 : _.now()
      timeout = null
      result = func.apply(context, args)
      //??? 几个意思 ？？？
      if (!timeout) context = args = null
    }
    return function () {
      var now = _.now()
      //首次执行时，如果设定了开始边界不执行选项，将上一次执行时间设定为当前时间
      if (!previous && options.leading === false) previous = now
      //settimeout
      //延迟执行时间间隔，  距离下一次调用的时间（窗口期结束？）
      //一语双关啊！！！
      //如果设置了options.leading  remianing = wait ，所以第一次不会触发
      //如果没设置，wait - now 一定 < 0,所以第一次会触发
      var remaining = wait - (now - previous)
      context = this
      args = arguments
      //延迟时间间隔remaining小于等于0，表示上次执行至此所间隔时间已经超过一个时间窗口
      //remaining大于时间窗口wait，表示客户端系统时间被调整过
      //有点自定义队列机制的意思
      if (remaining <= 0 || remaining > wait) {
        //如果还存在延迟调用，则清除延迟调用
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        previous = now
        result = func.apply(context, args)
        //数据保存在闭包上（共用的变量节约内存），所以每次使用后，都要重置闭包变量
        //必须重置，利用覆盖的话，如果下一个返回函数不传参数就不会覆盖，从而导致错误
        if (!timeout) context = args = null
        //注意else if 的语义 else if 是在上一个 if 的反面的前提下， 再if判断
        //remaining > 0 && remaining < wait  说明  还没到延迟调用的时间 && 时间没调整
        //如果不存在调用，且没有设定结尾不执行选项
        //注意：如果设定结尾不执行选项，意味着settimeout延时过了，也不能执行，所以要加以判断
      } else if (!timeout && options.trailing !== false) {
        //首次触发调用后，在第一个窗口期间内再触发，设置下一次的延迟函数
        //或首次触发没调用，在第一个窗口期间内再触发，设置下一次的延迟函数
        timeout = setTimeout(later, remaining)
      }
      //触发并调用会返回结果
      //触发没调用会返回undefined
      return result
    }
  }

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.

  //!!!???BUG 根本没时间房抖动的功能，只是throttle的简化版本

//debounce函数
//“延迟处理”
//创建一个具有防抖功能的函数.该函数会在 wait 毫秒数之后调用 func 方法，wait之内再触发的话，则重新等待wait毫秒
//immediate参数为true时，首次触发就调用
//func传入函数 ,wait时间窗口的间隔，immediate 设置为true时，调用触发于开始边界而不是结束边界
  _.debounce =  function(func, wait, immediate) {
    var timeout, args, context, timestamp, result
    var later = function () {
      //实际被延迟的时间
      var last = _.now() - timestamp
      // 客户端时间调整后，如果没触发，则和没调整之前一样，不受影响
      if (last < wait && last > 0) {
        //wait - last 距离下一次预期调用的时间
        timeout = setTimeout(later, wait - last)
        //超过了延迟时间则立即调用
      } else {
        timeout = null
        // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
        if (!immediate) {
          //immediate为false,或者为传入次参数
          result = func.apply(context, args)
          //???
          if (!timeout) context = args = null
        }
      }
    }

    return function () {
      context = this
      args = arguments
      //时间截
      timestamp = _.now()
      //mmediate为true时,第一次触发立即调用
      var callNow = immediate && !timeout
      //if (!timeout) timeout = setTimeout(later, wait)
      //???下面为自实现  源码存在bug
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) {
        result = func.apply(context, args)
        context = args = null
      }
      return result
    }
  }

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  //
  //

  //对partial的包装，改变了参数位置
  //wrapper包装器函数在外， func作为第一个参数在内
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  // 否定函数
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.

  //返回函数集 functions 组合后的复合函数, 也就是一个函数执行完之后把返回的结果再作为参数赋给下一个函数来执行.
  //以此类推. 在数学里, 把函数 f(), g(), 和 h() 组合起来可以得到复合函数 f(g(h()))
  //第一个函数为最外层，最后一个函数为最内层
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.

  // 该函数与 _.before 相反.
  // 该方法创建一个方法,当新方法被调用 n 或者更多次时将触发 func方法.
  // [n,无穷）会调用 ,前[1, n-1]调用无效，忽略前n-1次
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
      //等价于
      if (times <= 1) {
        times--
      }
      //等价于
      //if (times > 1)　{
      //  times--
      //} else {
      // }

    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.

  // 创建一个新的方法.该方法限定 func 方法.允许最多调用 func 的次数为 n - 1.
  // 当调用新方法的次数大于等于 n 时，将返回最后一次调用 func 所返回的结果.
  // 第[1, n - 1]会调用, 会调用n-1次
  // times = 2时 相等于 once()
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        // 3 2
        // 2 1
        memo = func.apply(this, arguments);
      }
      // ???
      // 感觉清除函数没什么意义
      // 第n-1次调用(最后一次有效调用)，以及之后就清除函数
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  //多用于lazy初始化 （只初始化一次呗）
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  //此例中{toString: null}的toString属性的值是无所谓的
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString'); //同于测试IE版本， IE < 9 时，toString方法会在 for in中被枚举，正常情况下不会被枚举
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',  // 不可枚举的属性，IE < 9 时，会存在bug
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  //???不理解
  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;

    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      // 在在对象中取到 && 自身实现和原型的实现不一样 && 不在keys中
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`

  // 创建一个数组，该数组包含所有目标对象自己所拥有（自身的属性）的枚举属性的名称.
  // 解决了IE < 9 时，存在的bug
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    //console.log(window instanceof Object) // true  不会存在引用丢失问题
    if (nativeKeys) return nativeKeys(obj); //原生的 Object.keys 可用， 则用原生
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.

    //不理解
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.

  // 返回对象的所以可枚举的属性（自身的和原型的）
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.

  //返回一个包含对象所有自身拥有枚举属性的值的数组.
  //非对象值会返回 []
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object

  // 和map函数的功能类似
  // 不同点，仅用于object， 传给迭代函数的参数不同，传入 value, key, obj。操作对象更方便
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.

  //返回一个键值对组成的数组. 类似 [[key1, value1], [key2, value2]].
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.

  //反转对象的键—值， (返回[value:key])
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`

  // 返回对象的能引用的所以方法，并且排序
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).

  // 与extendOwn功能类似， 不同的是原型的属性也会被追加
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)

  //扩展对象
  //分配来源对象的可枚举实例属性到目标对象.来源对象属性会覆盖以前分配的属性.
  //接受多个参数 第一个为目标对象  之后为追加对象
  _.extendOwn = _.assign = createAssigner( _.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.

  // 创建一个新对象，返回的是一个object实例及原型的一部分
  // 两种用法
  // 1.对象 + predicate
  // 2.对象/基本类型 + '字符串'
  // 不能用map代替的两个原因：1.allkeys 2. 基本类型
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      //获取全部属性
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      // 深度，不严格展开参数
      keys = flatten(arguments, false, false, 1);
      // 保持两种情况 对条件判断的一致性
      // 不使用cb, 因为此种情况需要的是 检查key对应的value是否存在
      iteratee = function(value, key, obj) { return key in obj; };
      // 将基本类型对象化,  in 操作可以判断相应的属性
      obj = Object(obj);
    }

    // 不使用 mapObject 的原因是，mapObject获取的是keys, 本函数获取的是 allKeys
    //_.mapObject(obj, function(value, key, obj){
    //  //
    //})
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.

  // omit和pick算法相同，结果相反
  // 在原对象中，删除部分属性，层级关系依然保留 例如  {a:{aa:123}, b:456}, 删除b后， 返回的是{a:{aa:123}} ，而不是{aa:123}
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      // predicate取反向
      iteratee = _.negate(iteratee);
    } else {
      //注意：展开的是参数数组，不是obj对象
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.

  // 追加自身属性和原型属性到obj上，并且不会覆盖原属性
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.

  //
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    //由于自实现的原型继承，扩展对象的属性，需要在之后附加
    //所以同一在之后追加属性
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  // 深复制  但只会复制对象本身
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.

  //interceptor 拦截器
  //interceptor会阻断链式调用，所以用tap函数返回obj,保持链式调用
  //调试时，感觉比较有用 或者 减少中间变量的创建，用于其他功能
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.

  // object中是否完全包含attrs的键值对，并且相等
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    //两个参数同时为空的时候  返回true
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.

  // 与 === 不同在于, eq更关注数据的值
  // 如果进行比较的是两个复合数据类型, 不仅仅比较是否来自同一个引用, 且会进行深层比较(对两个对象的结构和数据进行比较)
  // 函数特点：多出口
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    //利用 === 对相等的基本类型在此处返回, 同时解决了 `0 === -0` 的情况
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    // null 和 undefined 的比较在此处返回
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    // 取出被 _ 包装的对象
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    // 不同引用类型的两个变量会在此处返回
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        // 将变量字符串化
        // 正则表达式在此处返回
        // 字符串和对象化的字符串在此处返回
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        // 通过+a将a转成一个Number, 如果a被转换之前与转换之后不相等, 则认为a是一个NaN类型
        // 因为NaN与NaN是不相等的, 因此当a值为NaN时, 无法简单地使用a == b进行匹配, 而是用相同的方法检查b是否为NaN(即 b != +b)
        // 当a值是一个非NaN的数据时, 则检查a是否为0, 因为当b为-0时, 0 === -0是成立的(实际上它们在逻辑上属于两个不同的数据)
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
          // ???
          // 对 0 ,-0 的判断是多于的
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      // 对日期类型没有使用return或break, 因此会继续执行到下一步(无论数据类型是否为Boolean类型, 因为下一步将对Boolean类型进行检查)
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        // 将日期或布尔类型转换为数字
        // 日期类型将转换为数值类型的时间戳（毫秒）(无效的日期格式将被换转为NaN)
        // 布尔类型中, true被转换为1, false被转换为0
        // 比较两个日期或布尔类型被转换为数字后是否相等
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      // ???
      // 除了Function类型，还有其他类型吗
      //两个不同引用的Function类型变量，会直接返回false
      if (typeof a != 'object' || typeof b != 'object') return false;
      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      // 被比较的数据为对象类型
      // 如果两个对象不是同一个类的实例(通过constructor属性比较), 则认为两个对象不相等
      var aCtor = a.constructor, bCtor = b.constructor;
      //???  !(_.isFunction(aCtor) 有必要吗？
      // 不同frame的两个变量直接比较构造函数会返回true, 所以需要进一步判断
      //aCtor instanceof aCtor 保证在 aCtor（前） 和 aCtor 在同一全局作用域  （一个页面多个frame的时候，会返回false）
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    //???
    // 判定循环结构的相等性.
    // 这个测试循环结构的算法适用于 ES 5.1 第 15.12.3节, 抽象操作`J0`

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    // 初始化stack
    // 用于对象,数组的比较
    // 对两个数组类型变量做比较
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    // 如果是数组（类数组）的话，先判断位置是不是相同，不相同
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      //  ??? 不知道存在的意义，感觉没有也可以
      // 线性搜索. 性能与嵌套结构数量的数量成反比
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    // 递归比较对象和数组
    if (areArrays) {
      //数组
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // 对象（包括类数组）
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        // 不存在相等的键—值对，或者深递归不相等， 则返回false
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    // 推出本层函数压入数组的对象
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    // 浏览器实现的类数组，通过检查length属性判读， 自实现的类数组 不支持判断
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    //!!obj，将obj布尔化
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.

  // 谓词函数，判断数据类型
  // NaN也会被判断为Number类型
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    //属性名中有变量 用[]
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.

  // IE9 以下 没有 Arguments 类型，利用鸭子类型的方法，对arguments 进行判断
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).


  //修复bug   IE11 中  typeof Reg 的结果是function, 正常情况下是function
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?

  // ??? !isNaN(parseFloat(obj))
  // 判断是否是无穷大的整数值
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).

  //判断一个数是否是 特殊值NaN
  _.isNaN = function(obj) {
    //1.8.2 return _.isNumber(obj) && obj !== +obj;
    //1.8.3
    return _.isNumber(obj) && isNaN(obj);
  };

  // Is a given value a boolean?
  // 注意类型转换的问题
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).

  //检查对象是否具有某个属性
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    //this 就是 underscore 中的 _
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.

  //创建一个返回常量的函数
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};


  //与propertyOf形成对比
  //property 和 propertyOf 都是高阶函数
  //property 定key, 接受obj
  //propertyOf 定obj, 接受key
  _.property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of 
  // `key:value` pairs.

  // 高阶函数
  // 返回对_.isMatch的currying
  _.matcher = _.matches = function(attrs) {
    //??? 不理解
    // 可以删除 ，扩展也没什么意义
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.

  //调用函数n次，并把每次的索引值传给函数
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    //只传一个参数时，min则为0
    if (max == null) {
      max = min;
      min = 0;
    }
    // 由于Math.random()的取值范围是 [0,1),不能取到1， 所以增加单位1的区间，使其可以取到 [0,1]
    //由于此函数时对整数点的随机，所以增加一个区间，再与floor组合只是增加一个点，随机概率由于这种组合也不会产生误差
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  // 6 个html实体需要转换
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    // ??? var source = _.keys(map).join('|');
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      // 字符串化
      string = string == null ? '' : '' + string;
      //??? 为什么不直接replace ，性能？
      //return string.replace(replaceRegexp, escaper)
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  // 前两个参数为必选参数，第三个为可选参数
  // 此函数的作用是，调用obj[abc], 无论abc是属性，还是方法
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    //返回的 id 从 1 开始
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };


  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.

    // 默认的定界符格式，可自行修改，注意正则的写法，全局，惰性匹配
  _.templateSettings = {
    //JavaScript可执行代码的定界符
    // 使用惰性匹配的原因， 如果是贪婪匹配，同时存在多个定界符时，中间定界符的会被[\s\S]匹配,导致错误
    evaluate    : /<%([\s\S]+?)%>/g,
    // 直接输出变量的定界符
    // 与evaluate不同的是，interpolate会保存返回的变量， 而evaluate方法不会保存返回值，
    // 类似 <script> 和 JSONP的关系
    interpolate : /<%=([\s\S]+?)%>/g,
    // 将HTML标签 escape 成字符实体
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.

  //当不希望匹配任何字符串时，为了保持一致性，创建一个不匹配任何项的正则
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.

  //确保字符能被放置于构建函数的字符串中， 部分字符需要被转义，避免语法错误
  //在ECMA标准中 U+2028 和 U+2029字符 作为 行结束符 （line endings）,因此会被解释为"新的一行", 和\n同理，会在字符串（a string literal字面值）中，显式的回行，造成语法错误
  //像下面这样
  // "112
  // 789"
  //与JavaScript不同，在JSON中， U+2028 和 U+2029 是合法的字符。因为使用JSON表示字符会避免这个问题
  var escapes = {
    //转义'的原因是，构建函数的字符串，内部使用的引号就是’包裹字符串,将'转义 普通字符\'，避免产生语法错误
    "'":      "'",
    //如果想输出 普通字符\，需要对应输入\\\\,因为\会经过两次转义，一次做参数时\\\\，一次在函数内部时\\.得到结果\(普通字符)
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  //反斜杠, 单引号, 回车符, 换行符, 制表符, 行分隔符, 段落分隔符
  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  //字符串会当做函数的参数使用，因此例如想保留\n，需要构建\\n的输入
  //统一添加 \\ 字符串
  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.

  // template函数相当于接受 一种模板规则，相当于定义“函数”
  // template函数的返回函数 接受 数据，相当于传入参数

  // underscore 的 template 方法 支持任意分隔符，保留空白字符 并且 正确的 eacape 引用 通过 被插入的代码
  // 第一个为模板文本，
  // 第二个为模板配置， 类型是对象，输入需要自定义的配置，未输入配置，使用默认配置
  // 第三个为old配置
  // oldSettings 存在的目的是向后兼容

  _.template = function(text, settings, oldSettings) {
    //向后兼容可以忽略此处
    if (!settings && oldSettings) settings = oldSettings;
    //settings = settings || _.templateSettings 不对，此种写法 settings参数中各个配置需要全部传入
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    // 建立一个可使用正则表达式通过组合几个定界符
    var matcher = RegExp([
            // reg.source ——>正则表达式的字符串形式
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    // eacape相应的字符串，编译源模板
    // index 代表下次匹配开始的位置
    var index = 0;
    var source = "__p+='";
    // 注意matcher的形式
    // /<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|<%([\s\S]+?)%>|$/g
    // 匹配项， 捕获项，， 捕获项， 捕获项 ,匹配位置， 原始字符串(此处忽略)
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      // 将特殊符号转移为字符串形式
      source += text.slice(index, offset).replace(escaper, escapeChar);
      //不可以是 source += text.slice(index, offset);
      //因为在之后用Function创建函数时，如果存在转义序列，那么在新函数内部就会应用转义序列，预定的操作会出现语法错误
      index = offset + match.length;

      //模板中的三种变量
      if (escape) {
        // 等价于 source += "'+\n( " + escape + "== null ? ' ':" + _.escape(escape) +")\n'";
        // 注意:为什么要有单引号， 单引号和之前的单引号是一对 （字符串化render返回的结果, 例如"" + abc）
        // 字符串外层的 " 也是转义序列，用于包裹字符的功能，实际内容是""内部的内容
        // source作为参数传给Function时，去除了"的包裹，'由普通字符转义为功能字符，包裹函数内部的字符串
        // ???需要？ ：吗， 需要__t变量嘛？
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        //等价于 语义性更好 source += "'+\n( " + interpolate + "== null ? ' ':" + interpolate +")\n'";
        //传入的代码可以是一个简单的变量，也可以是一段JavaScript代码，代码的返回值会叠加到返回变量上 (注意：字符串开头有 + 号）
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        //source += "';\n" + evaluate + "\n'"; 相当于在一行也一个字符串表达式，容易出错，不好
        //传入的JavaScript代码用于构建函数，不会作为返回结果的一部分叠加到返回变量上  （注意：字符串开头没有 + 号）
        source += "';\n" + evaluate + "\n__p+='"
      }

      // Adobe VMs need the match returned to produce the correct offest.
      // 仅是解决bug问题
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    // settings.variable存在时，不再是对象—with的方式导入命名空间, 而是普通函数传参的思维（传x, 内部使用x,或x.abc等等）。没有了with,可以显著提升模板的渲染速度.
    // 示例
    // var a = _.template('<%= data.name%>',{variable: 'data'})
    // a({name:"chi"})
    // {name:"chi"}实参，settings.variable的值data为形参，模板为函数的内部定义data
    //
    // _.template("Using 'with': <%= data.answer %>", {variable: 'data'})({answer: 'no'});
    // "Using 'with': no"
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    //print 功能和 interpolate 类似，直接字符串拼接
    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      //
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      //抛出异常后，浏览器就不能正常调试了。将source附加到e上方便调试用
      e.source = source;
      //throw new Error(e)不对，因为发生的错误是已有的类型， 不需要自定义一种错误
      throw e;
    }

    var template = function(data) {
      // 将 _ 传入函数，不一定能用到
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    // 可以从模板函数取到函数的定义
    // 将函数字符串化，方便预编译使用，
    // 将函数字符串化，可以传给eval()
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.

  //返回一个包裹为 _ 的对象  从而可以使用链式语法
  _.chain = function(obj) {
    var instance = _(obj);
    //开启链式调用
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.

  //维持链式调用的函数
  var result = function(instance, obj) {//instance为调用者 obj为调用结果
    // 如果实例为包裹对象 则创建新的包裹对象返回本身值  如果是 _ 则返回本身 _
    // 如果调用者是链式调用的一环，则为返回结果也开启链式调用，
    // 否则直接返回结果 上一环的链式调用中 ._chain属性被手动设置为false，那么下一环的链式调用直接返回结果
    return instance._chain ? _(obj).chain() : obj;
    //等价于 return instance instanceOf _ ? _(obj).chain() : obj;  //性能上应该较慢
    //等价于 return instance._chain ? _.chain(obj) : obj;  //
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      //使之支持面向对象的调用方式
      var func = _[name] = obj[name];
      //使之支持函数式的调用方式
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
        //???优劣分析
        //等价于
        //this._wrapped = func.apply(_, args)
        //return this

      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.

  //将各个函数扩展到 _ 构造函数对应的原型上
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.

  // 将原生的数组方法，扩展到 _ 的原型上, 注意：但没扩展到 _ 对象上
  // 由于这些方法返回值不一致， 这里统一返回修改后的原数组
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      //???
      //delete obj[0]的 意义
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      // 由于这些方法返回值不一致， 这里统一返回修改后的原数组
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.

  // 将原生的数组方法，扩展到 _ 的原型上
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.

  // 提取被包裹的值
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.

  //代理方法， 等价于value()
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  // 提取被包裹的值，并字符串化
  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.

  //???
  //AMD规范就是其中比较著名一个，全称是Asynchronous Module Definition，即异步模块加载机制
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));
