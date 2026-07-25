$.koshkilJS = $.koshkilJS || {};
$.koshkilJS.acl = {
    permissions: {
        roles: [],
        rules:{}
    },
    checkRule: function (ruleToCheck) {
        var key;
        var attribute;
        if (Array.isArray(ruleToCheck)) { 
            var matches = 0;
            for (idx in ruleToCheck) {
                var rule = ruleToCheck[idx];
                if (rule.includes('.')) {
                    key = rule.split('.')[0];
                    attribute = rule.split('.')[1];
                } else {
                    key = rule;
                    attribute = null;
                }
                if (attribute === null) {
                    if ((this.permissions.rules[key] !== undefined)) {
                        matches++;
                    }
                } else {
                    if ((this.permissions.rules[key][attribute] !== undefined)) {
                        matches++;
                    }
                }
                if (matches == ruleToCheck.length) {
                    return true;
                }
            }
        } else {
            var rule = ruleToCheck;
            if (rule.includes('.')) {
                key = rule.split('.')[0];
                attribute = rule.split('.')[1];
            } else {
                key = rule;
                attribute = null;
            }
            if (attribute === null) {
                if ((this.permissions.rules[key] !== undefined)) {
                    return true;
                }
            } else {
                if ((this.permissions.rules[key] !== undefined && this.permissions.rules[key][attribute] !== undefined)) {
                    return true;
                }
            }
        }
        return false;
    },
    hasRoles: function (roles) {
        roles = roles || '';
        if (!Array.isArray(roles)) {
            roles = roles.split('|');
        }
        for (var role in roles) {
            if (roles[role].indexOf('&')!=-1) {
                var _roles = roles[role].split('&');
                var retVal = true;
                for(var _r in _roles) {
                    retVal = retVal && $.inArray(_roles[_r], this.permissions.roles)!==-1
                }
                if (retVal) {
                    return true;
                }
            }
            if ($.inArray(roles[role], this.permissions.roles)!==-1) {
                return true;
            }
        }
    },
    hasRules: function (rules) { 
        if (!rules) return true;
        if (!Array.isArray(rules)) {
            rules = rules.split('|');
        }
        var rulesToCheck = [];
        var hasCombinedRules = false;
        for (var idx in rules) {
            var rule = rules[idx];
            if (rule.includes('&') && !rule.includes("|")) {
                rulesToCheck.push(rule.split('&'))
            } else if (rule.includes('|') && !rule.includes("&")) { 
                var _rule = rule.explode('|');
                for (var i in _rule) {
                    rulesToCheck.push(_rule[i]);
                }
            } else {
                rulesToCheck.push(rule);
            }
        }
        for (idx in rulesToCheck) {
            if (this.checkRule(rulesToCheck[idx])) {
                return true;
            }
        }
    },
    hasRoleOrRule: function (role, rule) {
        role = role || '';
        rule = rule || '';
        if (!Array.isArray(role)) {
            role = role.split('|');
        }
        if (!Array.isArray(rule)) {
            rule = rule.split('|');
        }
        var hasRoles = this.hasRoles(role);
        if (hasRoles) {
            return true;
        }
        var hasRules = this.hasRules(rule);
    	var retVal= hasRoles|| hasRules;
        return retVal;
    }
}
