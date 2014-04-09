/**
 * Created by jkalweit on 3/28/2014.
 */

function MainCtrl($scope, $location, $firebaseSimpleLogin) {

    var dataRef = new Firebase("https://jkalweit.firebaseio.com");
    $scope.loginObj = $firebaseSimpleLogin(dataRef);

    if($location.path() != '/') {
        $scope.loginObj.$getCurrentUser().then(function (user) {
            if(!user)
                $location.path('/');
        });
    }

    $scope.logout = function () {
        $scope.loginObj.$logout();
        $location.path('/');
    };

    $scope.doTest = function () {

    };

}

function HomeCtrl($scope, $firebaseSimpleLogin) {

    $scope.logindisabled = true;
    var dataRef = new Firebase("https://jkalweit.firebaseio.com");
    $scope.loginObj = $firebaseSimpleLogin(dataRef);
    $scope.loginObj.$getCurrentUser().then(function () {
        $scope.logindisabled = false;
    }, function () {
        $scope.logindisabled = false;
    });

    $scope.loginGoogle = function () {
        $scope.loginObj.$login('google');
    }

    $scope.login = function () {
        $scope.logindisabled = true;
        $scope.status = 'Logging in...';
        $scope.loginObj.$login('password', {
            email: $scope.userlogin.email,
            password: $scope.userlogin.password
        }).then(function (user) {
                $scope.status = '';
                $scope.logindisabled = false;
            },
            function (error) {
                $scope.status = 'Failed to login: ' + error;
                $scope.logindisabled = false;
            });
    };

}

function MemberCtrl($scope, $routeParams, $firebase) {


    $scope.ybaic = $firebase(new Firebase("https://jkalweit.firebaseio.com/ybaic"))

    $scope.memberkey = $routeParams.id;
    $scope.member = $scope.ybaic.$child('members/' + $scope.memberkey);

    $scope.getMeetingNumber = function(meeting) {
        if($scope.ybaic && $scope.ybaic.meetings)
            return $scope.ybaic.meetings[meeting.key].meetingnumber;
        else
            return 0;
    };

    $scope.totalPaid = function(meetingkey) {

        var total = 0;

        var attendance = $scope.ybaic.meetings[meetingkey].attendance[$scope.memberkey]
        if(!attendance)
            return null;

        if(attendance.cash)
            total += Number(attendance.cash);
        if(attendance.check)
            total += Number(attendance.check);
        if(attendance.draft)
            total += Number(attendance.draft);

        return total;
    };


    $scope.saveMember = function () {
        $scope.member.$save().then(function () {
            $scope.status = 'Changes saved.';
        }, function (error) {
            $scope.status = 'Failed to save changes: ' + error;
        })
    };

}

function MembersCtrl($scope, $firebase, $modal) {

    $scope.ybaic = $firebase(new Firebase("https://jkalweit.firebaseio.com/ybaic"))
    $scope.members = $scope.ybaic.$child('members');

    $scope.addMember = function () {
        $scope.editMember(null, {});
    }
    $scope.deleteMember = function (key) {
        if(confirm('Are you sure you want to delete this member?')) {
            $scope.members.$remove(key);
        }
    }
    $scope.editMember = function (key, member) {
        $scope.editmember = member;
        var modalInstance = $modal.open({
            templateUrl: 'myModalContent.html',
            controller: MemberEditCtrl,
            resolve: {
                member: function () {
                    return $scope.editmember
                }
            }
        });

        modalInstance.result.then(function (member) {
            if(!key) {
                $scope.members.$add(member).then(function() {
                        $scope.status = 'Member added.';
                    },
                    function(error) {
                        $scope.status = 'FAILED to add member: ' + error;
                    }
                );
            } else {
                $scope.members.$child(key).$set(member).then(function() {
                        $scope.status = 'Saved changes to member.'
                    },
                    function(error) {
                        $scope.status = 'FAILED to saved changes to member: ' + error;
                    }
                );
            }
        }, function () {
            $scope.status = 'Edit canceled.'
        });
    };


    var MemberEditCtrl = function ($scope, $modalInstance, member) {

        $scope.member = {};
        angular.copy(member, $scope.member);

        $scope.offices = ['President', 'VP', 'Suckretary', 'IC'];
        $scope.committees = ['IC'];

        $scope.ok = function () {
            $modalInstance.close($scope.member);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    $scope.updateMembers = function () {

        for(var key in $scope.ybaic.members) {
            $scope.updateMember(key, $scope.members[key]);
            $scope.members.$save(key);
        }

        $scope.status = 'Members updated.';
    }

    $scope.updateMember = function (memberkey, member) {

        member.meetings = {};

        var totals  = {
            buyins: 0,
            dues: 0,
            fines: 0,
            guests: 0,
            cash: 0,
            check: 0,
            draft: 0,
            meetings: 0,
            meetingsAttended: 0
        };


        var meeting, attendance;
        for(var key in $scope.ybaic.meetings) {
            meeting = $scope.ybaic.meetings[key];
            attendance = meeting.attendance[memberkey];
            if(attendance) {
                member.meetings[key] = {
                    key: key
                };

                totals.meetings += 1;
                if(attendance.attendance)
                    totals.meetingsAttended += 1

                if(attendance.buyin)
                    totals.buyins += Number(attendance.buyin);
                if(attendance.dues)
                    totals.dues += Number(attendance.dues);
                if(attendance.fines)
                    totals.fines += Number(attendance.fines);
                if(attendance.guests)
                    totals.guests += Number(attendance.guests);
                if(attendance.cash)
                    totals.cash += Number(attendance.cash);
                if(attendance.check)
                    totals.check += Number(attendance.check);
                if(attendance.draft)
                    totals.draft += Number(attendance.draft);
            }
        }

        totals.totalDue = totals.buyins + totals.dues + totals.fines + totals.guests;
        totals.totalPaid = totals.cash + totals.check + totals.draft;
        totals.totalBalance = totals.totalPaid - totals.totalDue;
        member.totals = totals;
    };

}

function MeetingsCtrl($scope, $firebase, $modal) {



    $scope.ybaic = $firebase(new Firebase("https://jkalweit.firebaseio.com/ybaic"))
    $scope.meetings = $scope.ybaic.$child('meetings');

    $scope.addMeeting = function () {
        $scope.editMeeting(null, {});
    }
    $scope.deleteMeeting = function (key) {
        if(confirm('Are you sure you want to delete this meeting?')) {
            $scope.meetings.$remove(key);
        }
    }
    $scope.editMeeting = function (key, meeting) {
        var modalInstance = $modal.open({
            templateUrl: 'myModalContent.html',
            controller: MeetingEditCtrl,
            resolve: {
                meeting: function () {
                    return meeting;
                },
                members: function () {
                    var members = [];
                    angular.forEach($scope.ybaic.members, function (member) {
                       members.push(member.firstname + ' ' + member.lastname);
                    });
                    return members.sort();
                }
            }
        });

        modalInstance.result.then(function (meeting) {
            if(!key) {
                $scope.meetings.$add(meeting).then(function() {
                        $scope.status = 'Meeting added.';
                    },
                    function(error) {
                        $scope.status = 'FAILED to add meeting: ' + error;
                    }
                );
            } else {
                $scope.meetings.$child(key).$set(meeting).then(function() {
                        $scope.status = 'Saved changes to meeting.'
                    },
                    function(error) {
                        $scope.status = 'FAILED to saved changes to meeting: ' + error;
                    }
                );
            }
        }, function () {
            $scope.status = 'Edit canceled.'
        });
    };


    var MeetingEditCtrl = function ($scope, $modalInstance, meeting, members) {

        $scope.meeting = {};
        angular.copy(meeting, $scope.meeting);

        $scope.members = members;

        $scope.ok = function () {
            $modalInstance.close($scope.meeting);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };
}

function MeetingCtrl($scope, $firebase, $routeParams, $filter) {

    $scope.meetingKey = $routeParams.id;

    $scope.ybaic = $firebase(new Firebase("https://jkalweit.firebaseio.com/ybaic"));
    $scope.meeting = $scope.ybaic.$child('meetings/' + $scope.meetingKey );
    $scope.members = $scope.ybaic.$child('members');

    $scope.finances = $scope.meeting.$child('finances');
    $scope.payouts = $scope.finances.$child('payout');

    $scope.updateFinanceTotals = function () {

        var totals  = {
                buyins: 0,
                dues: 0,
                fines: 0,
                guests: 0,
                cash: 0,
                check: 0,
                draft: 0,
                cashPayouts: 0,
                checkPayouts: 0
            };

        angular.forEach($scope.meeting.attendance, function(attendance) {
            if(attendance.buyin)
                totals.buyins += Number(attendance.buyin);
            if(attendance.dues)
                totals.dues += Number(attendance.dues);
            if(attendance.fines)
                totals.fines += Number(attendance.fines);
            if(attendance.guests)
                totals.guests += Number(attendance.guests);
            if(attendance.cash)
                totals.cash += Number(attendance.cash);
            if(attendance.check)
                totals.check += Number(attendance.check);
            if(attendance.draft)
                totals.draft += Number(attendance.draft);
        });

        totals.totalDue = totals.buyins + totals.dues + totals.fines + totals.guests;
        totals.totalCollected = totals.cash + totals.check + totals.draft;
        totals.difference = totals.totalCollected - totals.totalDue;

        angular.forEach($scope.finances.payout, function(payout) {
            if(payout.type === 'Cash')
                totals.cashPayouts += payout.amount;
            if(payout.type === 'Check')
                totals.checkPayouts += payout.amount;
        });

        totals.bankDeposit = totals.cash + totals.check - totals.cashPayouts;
        totals.netChange = totals.bankDeposit + totals.draft - totals.checkPayouts;
        totals.endingBalance = Number($scope.finances.beginningBalance) + totals.netChange;
        $scope.finances.totals = totals;
    };

    $scope.addPayout = function () {
        $scope.payouts.$add({ amount: 0, note: '' });
    };
    $scope.removePayout = function (key) {
        $scope.payouts.$remove(key);
    };

    $scope.saveFinances = function () {
        $scope.finances.$save();
        $scope.payouts.$save();
    };

    $scope.attachMembers = function() {

        var members = $filter('toArray')($scope.ybaic.members);
        members.sort(function (a, b) {
            if(a.membernumber <= b.membernumber)
                return -1;
            return 1;
        });

        $scope.meeting.attendance = {};
        angular.forEach(members, function (member) {
            $scope.meeting.attendance[member.$key] = {
                key: member.$key,
                attendance: false,
                dues: 40
            };
        });

        $scope.saveAttendance();
    };

    $scope.getMemberNumber = function(attendance) {
        if($scope.ybaic && $scope.ybaic.members)
            return $scope.ybaic.members[attendance.key].membernumber;
        else
            return 0;
    };

    $scope.saveAttendance = function () {
        $scope.meeting.$save('attendance');
    };

    $scope.removeMember = function (memberKey) {
        delete $scope.meeting.attendance[memberKey];
        $scope.saveAttendance();
    };

}