/*
 * ============================================
 * Travel Nurse Intel™
 * Premium Page Access Guard
 * ============================================
 *
 * Plans:
 *
 * BASIC = $9.99/month
 * PRO   = $29.99/month
 * ELITE = $49.99/month
 *
 * Stripe Price IDs:
 *
 * BASIC:
 * price_1U4U7tPDubW3gyakFjNhmxfS
 *
 * PRO:
 * price_1THWqsPDubW3gyak56HoB3sp
 *
 * ELITE:
 * price_1U4UEnPDubW3gyakD3KyF0Ed
 *
 * Allowed subscription statuses:
 *
 * active
 * trialing
 *
 * ============================================
 */

(function () {

  'use strict';

  // ==========================================
  // Supabase Configuration
  // ==========================================

  const SUPABASE_URL =
    'https://tkxtdxopdwjaauwmhlkg.supabase.co';

  /*
   * Browser-safe Supabase key.
   *
   * NEVER use SUPABASE_SECRET_KEY here.
   */
  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_snRG3SmdO6umSUzutdWodQ_j76RCZ0B';

  // ==========================================
  // Subscription Statuses
  // ==========================================

  const ACTIVE_STATUSES = [
    'active',
    'trialing'
  ];

  // ==========================================
  // Plan Levels
  // ==========================================

  const PLAN_LEVELS = {

    basic: 1,

    pro: 2,

    elite: 3

  };

  // ==========================================
  // Page Requirements
  // ==========================================

  const PAGE_REQUIREMENTS = {

    // ----------------------------------------
    // BASIC
    // Basic + Pro + Elite
    // ----------------------------------------

    'travel-nurse-pay-transparency.html':
      'basic',

    'travel-nurse-pay-comparison.html':
      'basic',

    'travel-nurse-pay-directory.html':
      'basic',

    'subscriber-dashboard.html':
      'basic',

    'recruiter-dashboard.html':
      'basic',

    // ----------------------------------------
    // PRO
    // Pro + Elite
    // ----------------------------------------

    'travel-nurse-market-intelligence.html':
      'pro',

    'travel-nurse-pay-by-specialty.html':
      'pro',

    'travel-nurse-salary-database.html':
      'pro',

    'travel-nurse-pay-by-hospital.html':
      'pro',

    'travel-nurse-national-market.html':
      'pro',

    // ----------------------------------------
    // ELITE
    // Elite only
    // ----------------------------------------

    'travel-nurse-live-contracts.html':
      'elite',

    'travel-nurse-demand-heatmap.html':
      'elite',

    'travel-nurse-pay-heatmap.html':
      'elite',

    'travel-nurse-pay-houston.html':
      'elite',

    'travel-nurse-pay-phoenix.html':
      'elite',

    'travel-nurse-pay-san-diego.html':
      'elite',

    'contract-intelligence-report.html':
      'elite',

    // ----------------------------------------
    // Public
    // ----------------------------------------

    'recruiter-subscription.html':
      null

  };

  // ==========================================
  // Redirect URLs
  // ==========================================

  const LOGIN_URL =
    '/login.html';

  const UPGRADE_URL =
    '/recruiter-subscription.html';

  // ==========================================
  // Determine Current Page
  // ==========================================

  const filename =
    window.location.pathname
      .split('/')
      .pop()
      .toLowerCase();

  const requiredPlan =
    PAGE_REQUIREMENTS[filename];

  /*
   * Pages not listed above are public.
   */
  if (!requiredPlan) {
    return;
  }

  // ==========================================
  // Load Supabase
  // ==========================================

  function loadSupabase() {

    if (window.supabase) {

      return Promise.resolve(
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_PUBLISHABLE_KEY
        )
      );

    }

    return new Promise(
      function (resolve, reject) {

        const script =
          document.createElement('script');

        script.src =
          'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

        script.onload =
          function () {

            if (!window.supabase) {

              reject(
                new Error(
                  'Supabase failed to load.'
                )
              );

              return;

            }

            resolve(
              window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
              )
            );

          };

        script.onerror =
          function () {

            reject(
              new Error(
                'Unable to load Supabase.'
              )
            );

          };

        document.head.appendChild(
          script
        );

      }
    );

  }

  // ==========================================
  // Loading Screen
  // ==========================================

  function showLoading() {

    document.documentElement.style.visibility =
      'hidden';

    const loading =
      document.createElement('div');

    loading.id =
      'premiumAccessLoading';

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

    document.body.prepend(
      loading
    );

  }

  // ==========================================
  // Restore Page Visibility
  // ==========================================

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

  // ==========================================
  // Require Login
  // ==========================================

  function requireLogin() {

    window.location.replace(
      LOGIN_URL +
      '?redirect=' +
      encodeURIComponent(
        window.location.pathname
      )
    );

  }

  // ==========================================
  // Require Upgrade
  // ==========================================

  function requireUpgrade() {

    window.location.replace(
      UPGRADE_URL
    );

  }

  // ==========================================
  // Normalize Plan
  // ==========================================

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

  // ==========================================
  // Check Plan Level
  // ==========================================

  function hasRequiredPlan(
    userPlan,
    requiredPlan
  ) {

    const actual =
      normalizePlan(userPlan);

    const required =
      normalizePlan(requiredPlan);

    if (
      !actual ||
      !required
    ) {

      return false;

    }

    return (
      PLAN_LEVELS[actual] >=
      PLAN_LEVELS[required]
    );

  }

  // ==========================================
  // Verify Subscription Access
  // ==========================================

  async function verifyAccess() {

    showLoading();

    try {

      const supabase =
        await loadSupabase();

      // --------------------------------------
      // Get Authentication Session
      // --------------------------------------

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

      // --------------------------------------
      // User
      // --------------------------------------

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

      // --------------------------------------
      // Subscriber Record
      // --------------------------------------

      const {
        data: subscriber,
        error: subscriberError
      } =
        await supabase
          .from('subscribers')
          .select(`
            status,
            plan,
            current_period_end
          `)
          .eq(
            'email',
            email
          )
          .maybeSingle();

      // --------------------------------------
      // Database Error
      // --------------------------------------

      if (subscriberError) {

        console.error(
          'Subscriber access check failed:',
          subscriberError
        );

        requireUpgrade();

        return;

      }

      // --------------------------------------
      // No Subscriber / Inactive
      // --------------------------------------

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

      // --------------------------------------
      // Plan Verification
      // --------------------------------------

      if (
        !hasRequiredPlan(
          subscriber.plan,
          requiredPlan
        )
      ) {

        requireUpgrade();

        return;

      }

      // --------------------------------------
      // Access Approved
      // --------------------------------------

      window.TNI_SUBSCRIBER = {

        email,

        status:
          subscriber.status,

        plan:
          normalizePlan(
            subscriber.plan
          ),

        current_period_end:
          subscriber.current_period_end || null

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

  // ==========================================
  // Start Verification
  // ==========================================

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
