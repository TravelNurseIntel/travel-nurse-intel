/*
 * Travel Nurse Intel
 * Premium Page Access Guard
 *
 * Plans:
 * BASIC  = $9.99/mo
 * PRO    = $29.99/mo
 * ELITE  = $49.99/mo
 *
 * Allowed subscription statuses:
 * active
 * trialing
 */

(function () {
  'use strict';

  const SUPABASE_URL =
    'https://tkxtdxopdwjaauwmhlkg.supabase.co';

  const SUPABASE_ANON_KEY =
    'YOUR_SUPABASE_ANON_KEY_HERE';

  const ACTIVE_STATUSES = ['active', 'trialing'];

  /*
   * Configure the required minimum plan for each page.
   *
   * basic:
   *   Basic, Pro, or Elite
   *
   * pro:
   *   Pro or Elite
   *
   * elite:
   *   Elite only
   */
  const PLAN_LEVELS = {
    basic: 1,
    pro: 2,
    elite: 3
  };

  const PAGE_REQUIREMENTS = {

    // BASIC
    'travel-nurse-pay-transparency.html': 'basic',
    'travel-nurse-pay-comparison.html': 'basic',
    'travel-nurse-pay-directory.html': 'basic',

    // PRO
    'travel-nurse-market-intelligence.html': 'pro',
    'travel-nurse-pay-by-specialty.html': 'pro',
    'travel-nurse-salary-database.html': 'pro',
    'travel-nurse-pay-by-hospital.html': 'pro',
    'travel-nurse-national-market.html': 'pro',

    // ELITE
    'travel-nurse-live-contracts.html': 'elite',
    'travel-nurse-demand-heatmap.html': 'elite',
    'travel-nurse-pay-heatmap.html': 'elite',
    'travel-nurse-pay-houston.html': 'elite',
    'travel-nurse-pay-phoenix.html': 'elite',
    'travel-nurse-pay-san-diego.html': 'elite',
    'contract-intelligence-report.html': 'elite',

    // Dashboard
    'subscriber-dashboard.html': 'basic',

    // Recruiter system
    'recruiter-dashboard.html': 'basic',
    'recruiter-subscription.html': null,

    // Enterprise
    'enterprise-dashboard.html': 'elite'
  };

  /*
   * Redirect destination for unauthorized users.
   */
  const LOGIN_URL = '/login.html';

  const UPGRADE_URL = '/#plans';

  /*
   * Determine current filename.
   */
  const filename =
    window.location.pathname
      .split('/')
      .pop()
      .toLowerCase();

  const requiredPlan = PAGE_REQUIREMENTS[filename];

  /*
   * Pages not listed above are public.
   */
  if (!requiredPlan) {
    return;
  }

  /*
   * Create the Supabase client.
   */
  function loadSupabase() {

    if (window.supabase) {
      return Promise.resolve(
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        )
      );
    }

    return new Promise(function (resolve, reject) {

      const script = document.createElement('script');

      script.src =
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

      script.onload = function () {

        if (!window.supabase) {
          reject(
            new Error('Supabase failed to load.')
          );
          return;
        }

        resolve(
          window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
          )
        );

      };

      script.onerror = function () {
        reject(
          new Error('Unable to load Supabase.')
        );
      };

      document.head.appendChild(script);

    });

  }

  /*
   * Display a full-page loading screen while access
   * is being verified.
   */
  function showLoading() {

    document.documentElement.style.visibility =
      'hidden';

    const loading = document.createElement('div');

    loading.id = 'premiumAccessLoading';

    loading.style.cssText = `
      position:fixed;
      inset:0;
      z-index:999999;
      background:#f8fafc;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    `;

    loading.innerHTML = `
      <div style="
        text-align:center;
        padding:32px;
      ">
        <div style="
          width:42px;
          height:42px;
          border:4px solid #dbeafe;
          border-top-color:#2563eb;
          border-radius:50%;
          animation:tniSpin 0.8s linear infinite;
          margin:0 auto 18px;
        "></div>

        <div style="
          font-size:20px;
          font-weight:700;
          color:#111827;
          margin-bottom:8px;
        ">
          Verifying subscription access
        </div>

        <div style="
          font-size:14px;
          color:#6b7280;
        ">
          Travel Nurse Intel
        </div>
      </div>

      <style>
        @keyframes tniSpin {
          to {
            transform:rotate(360deg);
          }
        }
      </style>
    `;

    document.body.prepend(loading);
  }

  /*
   * Restore page visibility.
   */
  function showPage() {

    document.documentElement.style.visibility =
      'visible';

    const loading =
      document.getElementById(
        'premiumAccessLoading'
      );

    if (loading) {
      loading.remove();
    }

  }

  /*
   * Redirect unauthenticated users.
   */
  function requireLogin() {

    window.location.replace(
      LOGIN_URL +
      '?redirect=' +
      encodeURIComponent(
        window.location.pathname
      )
    );

  }

  /*
   * Redirect users whose plan is insufficient.
   */
  function requireUpgrade() {

    window.location.replace(
      UPGRADE_URL
    );

  }

  /*
   * Normalize plan names.
   */
  function normalizePlan(plan) {

    if (!plan) {
      return null;
    }

    const value =
      String(plan)
        .trim()
        .toLowerCase();

    if (
      value === 'basic' ||
      value === 'starter'
    ) {
      return 'basic';
    }

    if (
      value === 'pro' ||
      value === 'professional' ||
      value === 'standard'
    ) {
      return 'pro';
    }

    if (
      value === 'elite' ||
      value === 'premium'
    ) {
      return 'elite';
    }

    return null;
  }

  /*
   * Determine whether a user's plan satisfies
   * the required plan.
   */
  function hasRequiredPlan(
    userPlan,
    requiredPlan
  ) {

    const actual =
      normalizePlan(userPlan);

    const required =
      normalizePlan(requiredPlan);

    if (!actual || !required) {
      return false;
    }

    return (
      PLAN_LEVELS[actual] >=
      PLAN_LEVELS[required]
    );

  }

  /*
   * Main access check.
   */
  async function verifyAccess() {

    showLoading();

    try {

      const supabase =
        await loadSupabase();

      const {
        data: {
          session
        },
        error: sessionError
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !session
      ) {

        requireLogin();
        return;

      }

      const user =
        session.user;

      const email =
        (
          user.email ||
          ''
        )
          .trim()
          .toLowerCase();

      if (!email) {

        requireLogin();
        return;

      }

      const {
        data: subscriber,
        error: subscriberError
      } =
        await supabase
          .from('subscribers')
          .select(
            'status, plan'
          )
          .eq(
            'email',
            email
          )
          .maybeSingle();

      if (
        subscriberError
      ) {

        console.error(
          'Subscriber access check failed:',
          subscriberError
        );

        requireUpgrade();
        return;

      }

      if (
        !subscriber ||
        !ACTIVE_STATUSES.includes(
          String(
            subscriber.status
          ).toLowerCase()
        )
      ) {

        requireUpgrade();
        return;

      }

      if (
        !hasRequiredPlan(
          subscriber.plan,
          requiredPlan
        )
      ) {

        requireUpgrade();
        return;

      }

      /*
       * Access approved.
       */
      window.TNI_SUBSCRIBER = {
        email: email,
        status: subscriber.status,
        plan: normalizePlan(
          subscriber.plan
        )
      };

      showPage();

      document.dispatchEvent(
        new CustomEvent(
          'tni-access-granted',
          {
            detail:
              window.TNI_SUBSCRIBER
          }
        )
      );

    } catch (error) {

      console.error(
        'Travel Nurse Intel access error:',
        error
      );

      requireUpgrade();

    }

  }

  /*
   * Run immediately.
   */
  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      verifyAccess
    );

  } else {

    verifyAccess();

  }

})();
