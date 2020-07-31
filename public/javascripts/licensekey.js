$(document).ready(function () {
    $('#createLicenseKeyForm').on('submit', function (e) {
        e.preventDefault();
        $.ajax({
            type: 'POST',
            url: '/generateLicenseKey',
            success: function (data) {
                $('#createLicenseKeyForm').after('<hr><h3>A new license key has been generated : <big>' + data.licenseKey + "</big></h3><h2 style='word-break:break-all;'>Use this link : <a href='https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=https%3A%2F%2Fdiscordbottrades.herokuapp.com%2Fauth%2F" + data.licenseKey + "&client_id=P3FYOWCFDPAYMPS1UKGR2O0AVOCDRLGA%40AMER.OAUTHAP'>https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=https%3A%2F%2Fdiscordbottrades.herokuapp.com%2Fauth%2F" + data.licenseKey + "&client_id=P3FYOWCFDPAYMPS1UKGR2O0AVOCDRLGA%40AMER.OAUTHAP</a></h2>");
            }
        });
    });
});