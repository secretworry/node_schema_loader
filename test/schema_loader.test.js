"use strict";
/**
 * @author dusiyu
 * @date 3/22/17.
 */
const _       = require('lodash');
const assert  = require('assert');
const schema  = require('../lib');

describe('schema', function () {

  const resolve = schema.resolve;

  function loadUsers(ids) {
    const users = _.reduce(ids, function(map, id) {
      map[id] = {
        id: id,
        nickname: "name" + id,
        avatar_url: "http://www.test.com/avatars/" + id + ".png"
      };
      return map;
    }, {});
    return Promise.resolve(users);
  }

  function loadPage(id) {
    return Promise.resolve({
      id: id,
      state: 15,
      activators: "1,2,3,4"
    });
  }

  const userSchema = schema.Schema.fromDefinition({
    nickname: schema.field(),
    avatarUrl: schema.field('avatar_url')
  });

  const pageSchema = schema.Schema.fromDefinition({
    state: schema.field(),
  });

  const userWithPageSchema = schema.extend(userSchema, {
    page: schema.extend(pageSchema, {
      __resolver__: function(user, _) {
        return loadPage(user.id);
      }
    })
  });

  const meSchema = schema.extend(userWithPageSchema, {
    page: {
      activators: schema.extend(userSchema, {
        __resolver__: function(page) {
          const userIds = page.activators.split(',');
          return schema.batch(loadUsers, userIds, function (users) {
            return _.map(userIds, function (userId) {return users[userId];});
          });
        }
      })
    }
  });

  it('should resolve userSchema', function (done) {
    schema.resolve(userSchema, {id: "id", nickname: "nickname", avatar_url: "http://example.com/avatar.png"}).then(function (value) {
      assert.deepEqual(value, {
        nickname: "nickname",
        avatarUrl: "http://example.com/avatar.png"
      });
    }).then(done, done);
  });

  it('should resolve meSchema', function (done) {
    schema.resolve(meSchema, {id: "id", nickname: "nickname", avatar_url: "http://example.com/avatar.png"}).then(function (value) {
      assert.deepEqual(value, {
        nickname: "nickname",
        avatarUrl: "http://example.com/avatar.png",
        page: {
          state: 15,
          activators: [{
            nickname: "name1",
            avatarUrl: "http://www.test.com/avatars/1.png",
          },{
            nickname: "name2",
            avatarUrl: "http://www.test.com/avatars/2.png",
          },{
            nickname: "name3",
            avatarUrl: "http://www.test.com/avatars/3.png",
          },{
            nickname: "name4",
            avatarUrl: "http://www.test.com/avatars/4.png",
          }]
        }
      });
    }).then(done, done);
  });
});
