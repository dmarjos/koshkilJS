$.koshkilJS = $.koshkilJS || {}
$.koshkilJS.chat = {
    conversations: [],
    settings: {
    },

    /**
     * Init chat system
     */
    init: function(options) {
        this.settings=$.extend({
            ajaxChatURL:'',
            enableNotifications:true,
            myNick:'',
            pusherChannel:'koshkil-chat',
            pusherAppKey:'',
            pusherAppCluster:'',
            pusher:null,
            notifications: {
                connect: $.koshkilJS.helpers.getLink('/webroot/js/plugins/koshkil/notifications/open-up.mp3'),
                disconnect: $.koshkilJS.helpers.getLink('/webroot/js/plugins/koshkil/notifications/case-closed.mp3'),
                newmessage: $.koshkilJS.helpers.getLink('/webroot/js/plugins/koshkil/notifications/intuition.mp3'),
            },
            /**
             * Labels
             */
            lblUsersList: 'Chat',
            lblInputAreaPlaceholder: 'Escriba su mensaje',
            lblUserLogout:'El usuario abandon&oacute; la conversaci&oacute;n',
            lblUserLogin:'El usuario se uni&oacute; a la conversaci&oacute;n',

        },options);
        this.createUsersWindow();
        this.populateUsers();
        if (this.settings.pusherAppKey && this.settings.pusherAppCluster) {
            this.initPusher();
        } else {
            this.initTimeout();
        }
    },
    initTimeout: function () { },
    calculateWindowsPositions: function() {
        var right=10;
        $('.koshkil-chat').each(function() {
            if($(this).attr('id')=='user-0') {
                right+=$(this).width()+5;
                return;
            }
            $(this).css({
                right: right+'px'
            });
            right+=$(this).width()+5;
        });
    },
    createWindow: function(user) {
        var chatWindow=$('<div/>',{id:'user-'+user.id}).data('user',user).addClass('koshkil-chat');
        var titleBar=$('<div/>').addClass('title').appendTo(chatWindow);
        if (user.avatar!==null) {
            var avatar=$('<div/>').css({
                'background-image': 'url('+user.avatar+')',
            }).addClass('avatar').appendTo(titleBar);
            var unread=$('<div/>').addClass('unread').appendTo(titleBar);
        }
        var name=$('<div/>').addClass('name').html(user.name).appendTo(titleBar);
        var close=$('<div/>').addClass('close').appendTo(titleBar);
        $('<i/>').addClass('fa fa-times').appendTo(close);
        $(close).on('click',function(e) {
            e.preventDefault();
            e.stopPropagation();
            var myWindow=$(this).parents('.koshkil-chat');
            if ($(myWindow).attr('id')=='user-0') {
                $(myWindow).addClass('closed')
                return;
            } else {
                if ($(myWindow).hasClass('closed')) {
                    $(myWindow).remove()
                } else {
                    $(myWindow).addClass('closed')
                }
                $.koshkilJS.chat.calculateWindowsPositions();
            }
        })
        $(name).on('click',function(e) {
            e.preventDefault();
            e.stopPropagation();
            var myWindow=$(this).parents('.koshkil-chat');
            if ($(myWindow).hasClass('closed')) {
                $(myWindow).data('unread',0);
                $(myWindow).removeClass('closed')
                var messageArea=$(myWindow).find('.message-area');
                if ($(messageArea).length>0) {
                    $(messageArea).scrollTop($(messageArea)[0].scrollHeight);
                }
                $.koshkilJS.chat.showUnreadMessages($(myWindow).data('user'));
            } else {
                $(myWindow).addClass('closed')
            }
            $.koshkilJS.chat.calculateWindowsPositions();
        })
        return chatWindow;
    },

    createUsersWindow: function() {
        var user={name: this.settings.lblUsersList,avatar:null,id:0};
        var chatWindow=this.createWindow(user).addClass('closed');
        $('<div/>').addClass('users-list').appendTo(chatWindow);
        $(chatWindow).css({
            right:'10px'
        }).appendTo(document.body)
    },

    activateChatWindow: function(chatWindow) {
        $(chatWindow).find('.input-area').focus();
    },
    createChatWindow: function(user,closed) {
        if($('#user-'+user.id).length>0) {
            chatWindow=$('#user-'+user.id);
            if (!closed) $(chatWindow).removeClass('closed');
            this.activateChatWindow(chatWindow);
        } else {
            var chatWindow=this.createWindow(user);
            if (closed) $(chatWindow).addClass('closed');
            $(chatWindow).data('unread',0);
            var right=((this.conversations.length+1)*284)+10;
            this.conversations.push(user);
            $('<div/>').addClass('message-area').appendTo(chatWindow);
            $('<div/>').addClass('input-area').appendTo(chatWindow);
            $(chatWindow).css({
                right: right+'px'
            }).data('user',user).appendTo(document.body)
            this.enableInputArea(user);
            this.loadMessageHistory(user);
        }
        $.koshkilJS.chat.calculateWindowsPositions();
        return chatWindow;
    },

    loadMessageHistory: function(user) {
        var postData={
            userTo: user.id,
            action: 'loadHistory'
        }
        $.koshkilJS.helpers.callAjax(this.settings.ajaxChatURL,postData,function(response) {
            for(var msg in response.messages) {
                var message=response.messages[msg];
                $.koshkilJS.chat.addMessageToChat(message);
            }
        });
    },

    enableInputArea: function(user) {
        $('#user-'+user.id+' .input-area').attr({
            'contenteditable':"true",
            'placeholder':this.settings.lblInputAreaPlaceholder
        }).focusout(function(){
            var element = $(this);
            if (!element.text().trim().length) {
                element.empty();
            }
        }).on('keypress',function(e) {
            if (e.keyCode==13) {
                e.stopPropagation();
                e.preventDefault();
                var element = $(this);
                if (element.text().trim().length>0) {
                    var user=$(this).parents('.koshkil-chat').data('user');
                    $.koshkilJS.chat.sendMessage(user,$(this).html());
                    $(this).empty();
                }
            }
        });
    },

    sendMessage: function(user,message) {
        var postData={
            userTo: user.id,
            message: message,
            action: 'sendMessage'
        }
        $.koshkilJS.helpers.callAjax(this.settings.ajaxChatURL,postData,function(response) {
            $.koshkilJS.chat.addMessageToChat(response.message);
        });
    },

    addSystemMessage: function(user,message) {
        if ($('#user-'+user.id).length==0) return false;
        var chatWindow=$('#user-'+user.id);
        var unread=$(chatWindow).data('unread');
        unread++;
        $(chatWindow).data('unread',unread);
        var messageCluster=$('<div/>').addClass('message-cluster');
        var messageBlob=$('<div/>').addClass('message').appendTo(messageCluster);
        $(messageBlob).addClass('system');
        $(messageBlob).html(message);
        var messageArea=$(chatWindow).find('.message-area');
        $(messageCluster).appendTo(messageArea);
        $(messageArea).scrollTop($(messageArea)[0].scrollHeight);
        return true;
    },
    addMessageToChat: function(message) {
        var messageCluster=$('<div/>').addClass('message-cluster');
        var messageBlob=$('<div/>').addClass('message').appendTo(messageCluster);
        $(messageBlob).addClass(message.origin);
        $(messageBlob).html(message.message);
        var windowId=$('#user-'+message.recipient.id).length>0?message.recipient.id:message.sender.id;
        $(messageCluster).appendTo('#user-'+windowId+' .message-area');
        $('#user-'+windowId+' .message-area').scrollTop($('#user-'+windowId+' .message-area')[0].scrollHeight);
    },

    populateUsers: function() {
        $.koshkilJS.helpers.callAjax(this.settings.ajaxChatURL,{action: 'getUsers'},function(response) {
            for(var i=0; i<response.users.length; i++) {
                var user=response.users[i];
                var userRow=$('<div/>',{id:'u'+user.id}).data('user',user).addClass('user').appendTo('#user-0 .users-list');
                if (user.online=='0') $(userRow).addClass('offline');
                $('<div/>').addClass('avatar').css({
                    'background-image': 'url('+user.avatar+')',
                }).appendTo(userRow);
                $('<div/>').addClass('name').html(user.name).appendTo(userRow);
                $(userRow).on('click',function() {
                    var user=$(this).data('user');
                    $.koshkilJS.chat.createChatWindow(user);
                })
            }
        })
    },

    showUnreadMessages: function(user) {
        var chatWindow=$('#user-'+user.id);

        var unreadBadge=$(chatWindow).find('.title .unread');
        if ($(chatWindow).data('unread')>0) {
            $(unreadBadge).addClass('visible');
        } else {
            $(unreadBadge).removeClass('visible');
        }
    },
    initPusher: function() {
        this.settings.pusher = new Pusher(this.settings.pusherAppKey, {
          cluster: this.settings.pusherAppCluster
        });
        this.settings.channel = this.settings.pusher.subscribe(this.settings.pusherChannel);
        this.settings.channel.bind('message-for-'+this.settings.myNick,function(data) {
            var chatWindow=$.koshkilJS.chat.createChatWindow(data.sender,true);
            if (!document.hasFocus() || $(chatWindow).hasClass('closed')) {
                if ($.koshkilJS.chat.settings.enableNotifications) {
                    var audio = new Audio($.koshkilJS.chat.settings.notifications.newmessage);
                    audio.play();
                }
                var unread=$(chatWindow).data('unread');
                unread++;
                $(chatWindow).data('unread',unread);
                $.koshkilJS.chat.showUnreadMessages(data.sender);
            }
            $.koshkilJS.chat.addMessageToChat(data);
        });
        this.settings.channel.bind('user-connect',function(data) {
            $('#user-0 .users-list #u'+data.user_id).removeClass('offline');
            if ($.koshkilJS.chat.addSystemMessage({id: data.user_id},$.koshkilJS.chat.settings.lblUserLogin)) {
                if ($.koshkilJS.chat.settings.enableNotifications) {
                    var audio = new Audio($.koshkilJS.chat.settings.notifications.connect);
                    audio.play();
                }
            }
        });
        this.settings.channel.bind('user-disconnect',function(data) {
            $('#user-0 .users-list #u'+data.user_id).addClass('offline');
            if ($.koshkilJS.chat.addSystemMessage({id: data.user_id},$.koshkilJS.chat.settings.lblUserLogout)) {
                if ($.koshkilJS.chat.settings.enableNotifications) {
                    var audio = new Audio($.koshkilJS.chat.settings.notifications.disconnect);
                    audio.play();
                }
            }
        });
    },

    handleIncomingMessage: function(data) {
        console.log(data);
    },
}
