<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Admin Bootstrap Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration file provides settings for the admin bootstrap feature,
    | mapping environment variables to application configuration keys.
    |
    */

    // Admin email address used for bootstrap initialization
    'email' => env('ADMIN_EMAIL'),

    // Admin username (reserved for future use, not persisted to database)
    'username' => env('ADMIN_USERNAME'),

    // Admin password for authentication
    'password' => env('ADMIN_PASSWORD'),

    // Admin first name
    'first_name' => env('ADMIN_FIRST_NAME'),

    // Admin last name
    'last_name' => env('ADMIN_LAST_NAME'),
];
