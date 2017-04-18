"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BaseVisitor = exports.BaseVisitor = function () {
  function BaseVisitor() {
    _classCallCheck(this, BaseVisitor);
  }

  _createClass(BaseVisitor, [{
    key: 'visitObjectField',
    value: function visitObjectField(field) {}
  }, {
    key: 'visitArrayField',
    value: function visitArrayField(field) {}
  }, {
    key: 'visitLeafField',
    value: function visitLeafField(field) {}
  }, {
    key: 'visitLoadingField',
    value: function visitLoadingField(field) {}
  }]);

  return BaseVisitor;
}();

var ObjectField = exports.ObjectField = function () {
  function ObjectField(rootValue) {
    _classCallCheck(this, ObjectField);

    this.rootValue = rootValue;
    this.fields = {};
  }

  _createClass(ObjectField, [{
    key: 'resolve',
    value: function resolve() {
      var result = {};
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(this.fields)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          result[key] = this.fields[key].resolve();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return result;
    }
  }, {
    key: 'visit',
    value: function visit(visitor) {
      visitor.visitObjectField(this);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.keys(this.fields)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var key = _step2.value;

          this.fields[key].visit(visitor);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }]);

  return ObjectField;
}();

var ArrayField = exports.ArrayField = function () {
  function ArrayField(values) {
    _classCallCheck(this, ArrayField);

    this.values = values;
  }

  _createClass(ArrayField, [{
    key: 'resolve',
    value: function resolve() {
      var result = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.values[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var value = _step3.value;

          result.push(value.resolve());
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return result;
    }
  }, {
    key: 'visit',
    value: function visit(visitor) {
      visitor.visitArrayField(this);
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.values[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var value = _step4.value;

          value.visit(visitor);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }]);

  return ArrayField;
}();

var LeafField = exports.LeafField = function () {
  function LeafField(value) {
    _classCallCheck(this, LeafField);

    this.value = value;
  }

  _createClass(LeafField, [{
    key: 'resolve',
    value: function resolve() {
      return this.value;
    }
  }, {
    key: 'visit',
    value: function visit(visitor) {
      visitor.visitLeafField(this);
    }
  }]);

  return LeafField;
}();

var LoadingField = exports.LoadingField = function () {
  function LoadingField(promise, callback) {
    _classCallCheck(this, LoadingField);

    this.promise = promise;
    this.callback = callback;
  }

  _createClass(LoadingField, [{
    key: 'resolve',
    value: function resolve() {
      throw "Resolving a Loading Field";
    }
  }, {
    key: 'load',
    value: function load(context) {
      var callback = this.callback;
      return this.promise.then(function (value) {
        return callback(value, context);
      });
    }
  }, {
    key: 'visit',
    value: function visit(visitor) {
      visitor.visitLoadingField(this);
    }
  }]);

  return LoadingField;
}();