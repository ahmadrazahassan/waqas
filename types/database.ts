// Generated from the Supabase schema. Do not edit by hand.
// Regenerate with the Supabase MCP `generate_typescript_types` tool.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          ip_hash: string | null
          subject_id: string | null
          subject_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: number
          ip_hash?: string | null
          subject_id?: string | null
          subject_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: number
          ip_hash?: string | null
          subject_id?: string | null
          subject_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          applies_to: Database["public"]["Enums"]["commission_applies_to"]
          depth: number
          effective_from: string
          effective_to: string | null
          id: number
          note: string | null
          plan_id: number
          rate_bps: number
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["commission_applies_to"]
          depth: number
          effective_from?: string
          effective_to?: string | null
          id?: number
          note?: string | null
          plan_id: number
          rate_bps: number
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["commission_applies_to"]
          depth?: number
          effective_from?: string
          effective_to?: string | null
          id?: number
          note?: string | null
          plan_id?: number
          rate_bps?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount_minor: number
          base_minor: number
          cleared_at: string | null
          clears_at: string
          created_at: string
          currency: string
          depth: number
          earner_id: string
          id: string
          multiplier_bps: number
          payment_id: string
          rate_bps: number
          reversed_reason: string | null
          source_user_id: string
          status: Database["public"]["Enums"]["commission_status"]
        }
        Insert: {
          amount_minor: number
          base_minor: number
          cleared_at?: string | null
          clears_at: string
          created_at?: string
          currency?: string
          depth: number
          earner_id: string
          id?: string
          multiplier_bps?: number
          payment_id: string
          rate_bps: number
          reversed_reason?: string | null
          source_user_id: string
          status?: Database["public"]["Enums"]["commission_status"]
        }
        Update: {
          amount_minor?: number
          base_minor?: number
          cleared_at?: string | null
          clears_at?: string
          created_at?: string
          currency?: string
          depth?: number
          earner_id?: string
          id?: string
          multiplier_bps?: number
          payment_id?: string
          rate_bps?: number
          reversed_reason?: string | null
          source_user_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "commissions_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "commissions_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "commissions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_signals: {
        Row: {
          created_at: string
          detail: Json
          id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["fraud_severity"]
          signal: string
          state: Database["public"]["Enums"]["fraud_state"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: Json
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["fraud_severity"]
          signal: string
          state?: Database["public"]["Enums"]["fraud_state"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: Json
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["fraud_severity"]
          signal?: string
          state?: Database["public"]["Enums"]["fraud_state"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_signals_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fraud_signals_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fraud_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_points: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          memo: string | null
          points: number
          reason: Database["public"]["Enums"]["points_reason"]
          ref_id: string | null
          ref_table: string | null
          season_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          memo?: string | null
          points: number
          reason: Database["public"]["Enums"]["points_reason"]
          ref_id?: string | null
          ref_table?: string | null
          season_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          memo?: string | null
          points?: number
          reason?: Database["public"]["Enums"]["points_reason"]
          ref_id?: string | null
          ref_table?: string | null
          season_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_points_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "leaderboard_points_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_points_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "leaderboard_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          avatar_url: string | null
          computed_at: string
          country_code: string
          display_name: string
          points: number
          position: number
          rank_id: number
          rank_name: string
          season_id: number
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          computed_at?: string
          country_code: string
          display_name: string
          points: number
          position: number
          rank_id: number
          rank_name: string
          season_id: number
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          computed_at?: string
          country_code?: string
          display_name?: string
          points?: number
          position?: number
          rank_id?: number
          rank_name?: string
          season_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      level_reward_payments: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          id: string
          period_month: string
          rank_id: number
          user_id: string
          wallet_entry_id: number | null
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          id?: string
          period_month: string
          rank_id: number
          user_id: string
          wallet_entry_id?: number | null
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: string
          period_month?: string
          rank_id?: number
          user_id?: string
          wallet_entry_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "level_reward_payments_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_reward_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "level_reward_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_reward_payments_wallet_entry_id_fkey"
            columns: ["wallet_entry_id"]
            isOneToOne: false
            referencedRelation: "wallet_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: number
          provider: string
          provider_customer_id: string | null
          provider_purchase_id: string | null
          purchased_at: string
          revoked_at: string | null
          revoked_reason: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: number
          provider?: string
          provider_customer_id?: string | null
          provider_purchase_id?: string | null
          purchased_at?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: number
          provider?: string
          provider_customer_id?: string | null
          provider_purchase_id?: string | null
          purchased_at?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_declarations: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          id: string
          method: string
          note: string | null
          payment_id: string | null
          plan_id: number
          proof_path: string | null
          reference: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["declaration_status"]
          user_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          note?: string | null
          payment_id?: string | null
          plan_id: number
          proof_path?: string | null
          reference?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["declaration_status"]
          user_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          note?: string | null
          payment_id?: string | null
          plan_id?: number
          proof_path?: string | null
          reference?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["declaration_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_declarations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_declarations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_declarations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "payment_declarations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_declarations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "payment_declarations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          currency: string
          fee_minor: number
          gross_minor: number
          id: string
          is_first_payment: boolean
          net_minor: number
          paid_at: string
          plan_id: number | null
          provider: string
          provider_ref: string | null
          refund_amount_minor: number
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          tax_minor: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          fee_minor?: number
          gross_minor: number
          id?: string
          is_first_payment: boolean
          net_minor: number
          paid_at?: string
          plan_id?: number | null
          provider?: string
          provider_ref?: string | null
          refund_amount_minor?: number
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          tax_minor?: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          fee_minor?: number
          gross_minor?: number
          id?: string
          is_first_payment?: boolean
          net_minor?: number
          paid_at?: string
          plan_id?: number | null
          provider?: string
          provider_ref?: string | null
          refund_amount_minor?: number
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          tax_minor?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          amount_minor: number
          approved_at: string | null
          approved_by: string | null
          currency: string
          destination_label: string | null
          destination_token: string | null
          failure_reason: string | null
          id: string
          method: string
          processed_at: string | null
          provider_ref: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Insert: {
          amount_minor: number
          approved_at?: string | null
          approved_by?: string | null
          currency?: string
          destination_label?: string | null
          destination_token?: string | null
          failure_reason?: string | null
          id?: string
          method?: string
          processed_at?: string | null
          provider_ref?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Update: {
          amount_minor?: number
          approved_at?: string | null
          approved_by?: string | null
          currency?: string
          destination_label?: string | null
          destination_token?: string | null
          failure_reason?: string | null
          id?: string
          method?: string
          processed_at?: string | null
          provider_ref?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "payout_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "payout_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          features: Json
          id: number
          is_active: boolean
          monthly_claims: number | null
          name: string
          payout_threshold_minor: number
          price_minor: number
          provider_price_id: string | null
          referral_points: number
          sort_order: number
          summary: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          features?: Json
          id?: number
          is_active?: boolean
          monthly_claims?: number | null
          name: string
          payout_threshold_minor: number
          price_minor: number
          provider_price_id?: string | null
          referral_points: number
          sort_order: number
          summary: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          features?: Json
          id?: number
          is_active?: boolean
          monthly_claims?: number | null
          name?: string
          payout_threshold_minor?: number
          price_minor?: number
          provider_price_id?: string | null
          referral_points?: number
          sort_order?: number
          summary?: string
        }
        Relationships: []
      }
      prize_awards: {
        Row: {
          awarded_at: string
          final_points: number
          final_position: number
          id: string
          notes: string | null
          prize_id: number
          season_id: number
          status: Database["public"]["Enums"]["award_status"]
          user_id: string
          verified_by: string | null
        }
        Insert: {
          awarded_at?: string
          final_points: number
          final_position: number
          id?: string
          notes?: string | null
          prize_id: number
          season_id: number
          status?: Database["public"]["Enums"]["award_status"]
          user_id: string
          verified_by?: string | null
        }
        Update: {
          awarded_at?: string
          final_points?: number
          final_position?: number
          id?: string
          notes?: string | null
          prize_id?: number
          season_id?: number
          status?: Database["public"]["Enums"]["award_status"]
          user_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prize_awards_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_awards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_awards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "prize_awards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_awards_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "prize_awards_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prizes: {
        Row: {
          cash_alternative_minor: number | null
          currency: string
          description_md: string | null
          id: number
          image_path: string | null
          position_from: number
          position_to: number
          season_id: number
          title: string
        }
        Insert: {
          cash_alternative_minor?: number | null
          currency?: string
          description_md?: string | null
          id?: number
          image_path?: string | null
          position_from: number
          position_to: number
          season_id: number
          title: string
        }
        Update: {
          cash_alternative_minor?: number | null
          currency?: string
          description_md?: string | null
          id?: number
          image_path?: string | null
          position_from?: number
          position_to?: number
          season_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "prizes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          commission_eligible: boolean
          country_code: string
          created_at: string
          display_name: string | null
          full_name: string
          headline: string | null
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          last_task_approved_at: string | null
          leaderboard_optin: boolean
          phone_e164: string | null
          phone_verified_at: string | null
          rank_id: number
          rank_since: string
          referral_code: string
          referred_by: string | null
          sponsor_locked_at: string | null
          status: Database["public"]["Enums"]["account_status"]
          timezone: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          commission_eligible?: boolean
          country_code?: string
          created_at?: string
          display_name?: string | null
          full_name: string
          headline?: string | null
          id: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_task_approved_at?: string | null
          leaderboard_optin?: boolean
          phone_e164?: string | null
          phone_verified_at?: string | null
          rank_id?: number
          rank_since?: string
          referral_code: string
          referred_by?: string | null
          sponsor_locked_at?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          timezone?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          commission_eligible?: boolean
          country_code?: string
          created_at?: string
          display_name?: string | null
          full_name?: string
          headline?: string | null
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_task_approved_at?: string | null
          leaderboard_optin?: boolean
          phone_e164?: string | null
          phone_verified_at?: string | null
          rank_id?: number
          rank_since?: string
          referral_code?: string
          referred_by?: string | null
          sponsor_locked_at?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          timezone?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_events: {
        Row: {
          error: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string
        }
        Insert: {
          error?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          received_at?: string
        }
        Update: {
          error?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
        }
        Relationships: []
      }
      ranks: {
        Row: {
          direct_referrals: number
          id: number
          monthly_reward_minor: number | null
          multiplier_bps: number
          name: string
          qa_score: number | null
          slug: string
          tasks_approved: number
          unlocks: string
        }
        Insert: {
          direct_referrals: number
          id: number
          monthly_reward_minor?: number | null
          multiplier_bps?: number
          name: string
          qa_score?: number | null
          slug: string
          tasks_approved: number
          unlocks: string
        }
        Update: {
          direct_referrals?: number
          id?: number
          monthly_reward_minor?: number | null
          multiplier_bps?: number
          name?: string
          qa_score?: number | null
          slug?: string
          tasks_approved?: number
          unlocks?: string
        }
        Relationships: []
      }
      referral_attributions: {
        Row: {
          converted_at: string | null
          converted_user_id: string | null
          first_code: string
          first_touch_at: string
          last_code: string
          last_touch_at: string
          visitor_id: string
        }
        Insert: {
          converted_at?: string | null
          converted_user_id?: string | null
          first_code: string
          first_touch_at?: string
          last_code: string
          last_touch_at?: string
          visitor_id: string
        }
        Update: {
          converted_at?: string | null
          converted_user_id?: string | null
          first_code?: string
          first_touch_at?: string
          last_code?: string
          last_touch_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_attributions_converted_user_id_fkey"
            columns: ["converted_user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "referral_attributions_converted_user_id_fkey"
            columns: ["converted_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          channel: string | null
          code: string
          country_code: string | null
          created_at: string
          id: string
          ip_hash: string | null
          landing_path: string | null
          ua_hash: string | null
          utm: Json | null
          visitor_id: string
        }
        Insert: {
          channel?: string | null
          code: string
          country_code?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          ua_hash?: string | null
          utm?: Json | null
          visitor_id: string
        }
        Update: {
          channel?: string | null
          code?: string
          country_code?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          ua_hash?: string | null
          utm?: Json | null
          visitor_id?: string
        }
        Relationships: []
      }
      referral_edges: {
        Row: {
          ancestor_id: string
          created_at: string
          depth: number
          descendant_id: string
        }
        Insert: {
          ancestor_id: string
          created_at?: string
          depth: number
          descendant_id: string
        }
        Update: {
          ancestor_id?: string
          created_at?: string
          depth?: number
          descendant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_edges_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "referral_edges_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_edges_descendant_id_fkey"
            columns: ["descendant_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "referral_edges_descendant_id_fkey"
            columns: ["descendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          awarded_at: string | null
          closed_at: string | null
          created_at: string
          ends_at: string
          id: number
          name: string
          rules_md: string
          settled_at: string | null
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["season_status"]
          task_point_cap_bps: number
          track: Database["public"]["Enums"]["season_track"]
        }
        Insert: {
          awarded_at?: string | null
          closed_at?: string | null
          created_at?: string
          ends_at: string
          id?: number
          name: string
          rules_md: string
          settled_at?: string | null
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["season_status"]
          task_point_cap_bps?: number
          track: Database["public"]["Enums"]["season_track"]
        }
        Update: {
          awarded_at?: string | null
          closed_at?: string | null
          created_at?: string
          ends_at?: string
          id?: number
          name?: string
          rules_md?: string
          settled_at?: string | null
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["season_status"]
          task_point_cap_bps?: number
          track?: Database["public"]["Enums"]["season_track"]
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      submission_reviews: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["review_decision"]
          feedback: string | null
          id: string
          reviewer_id: string
          rubric: Json
          score: number | null
          submission_id: string
        }
        Insert: {
          created_at?: string
          decision: Database["public"]["Enums"]["review_decision"]
          feedback?: string | null
          id?: string
          reviewer_id: string
          rubric?: Json
          score?: number | null
          submission_id: string
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"]
          feedback?: string | null
          id?: string
          reviewer_id?: string
          rubric?: Json
          score?: number | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "submission_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          body: string | null
          claim_id: string
          created_at: string
          file_paths: string[]
          id: string
          notes: string | null
          task_id: string
          user_id: string
          version: number
        }
        Insert: {
          body?: string | null
          claim_id: string
          created_at?: string
          file_paths?: string[]
          id?: string
          notes?: string | null
          task_id: string
          user_id: string
          version?: number
        }
        Update: {
          body?: string | null
          claim_id?: string
          created_at?: string
          file_paths?: string[]
          id?: string
          notes?: string | null
          task_id?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "submissions_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "task_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          name: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string | null
          topic: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string | null
          topic: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string | null
          topic?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          summary: string | null
        }
        Insert: {
          id?: number
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          summary?: string | null
        }
        Update: {
          id?: number
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          summary?: string | null
        }
        Relationships: []
      }
      task_claims: {
        Row: {
          claimed_at: string
          closed_at: string | null
          due_at: string
          id: string
          status: Database["public"]["Enums"]["claim_status"]
          task_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          closed_at?: string | null
          due_at: string
          id?: string
          status?: Database["public"]["Enums"]["claim_status"]
          task_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          closed_at?: string | null
          due_at?: string
          id?: string
          status?: Database["public"]["Enums"]["claim_status"]
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_claims_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "task_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          brief: string
          category_id: number
          claims_used: number
          compliance_flag: Database["public"]["Enums"]["compliance_flag"]
          created_at: string
          created_by: string | null
          currency: string
          deliverable_type: string
          due_hours: number
          early_access_opens_at: string | null
          id: string
          max_claims: number
          min_rank_id: number
          opens_at: string
          payout_minor: number
          slug: string
          status: Database["public"]["Enums"]["task_status"]
          summary: string
          title: string
          updated_at: string
          word_count_target: number | null
        }
        Insert: {
          brief: string
          category_id: number
          claims_used?: number
          compliance_flag?: Database["public"]["Enums"]["compliance_flag"]
          created_at?: string
          created_by?: string | null
          currency?: string
          deliverable_type?: string
          due_hours?: number
          early_access_opens_at?: string | null
          id?: string
          max_claims?: number
          min_rank_id?: number
          opens_at?: string
          payout_minor: number
          slug: string
          status?: Database["public"]["Enums"]["task_status"]
          summary: string
          title: string
          updated_at?: string
          word_count_target?: number | null
        }
        Update: {
          brief?: string
          category_id?: number
          claims_used?: number
          compliance_flag?: Database["public"]["Enums"]["compliance_flag"]
          created_at?: string
          created_by?: string | null
          currency?: string
          deliverable_type?: string
          due_hours?: number
          early_access_opens_at?: string | null
          id?: string
          max_claims?: number
          min_rank_id?: number
          opens_at?: string
          payout_minor?: number
          slug?: string
          status?: Database["public"]["Enums"]["task_status"]
          summary?: string
          title?: string
          updated_at?: string
          word_count_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_min_rank_id_fkey"
            columns: ["min_rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "ticket_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_entries: {
        Row: {
          amount_minor: number
          balance_after_minor: number
          created_at: string
          created_by: string | null
          currency: string
          entry_type: Database["public"]["Enums"]["wallet_entry_type"]
          id: number
          memo: string | null
          ref_id: string | null
          ref_table: string | null
          user_id: string
        }
        Insert: {
          amount_minor: number
          balance_after_minor: number
          created_at?: string
          created_by?: string | null
          currency?: string
          entry_type: Database["public"]["Enums"]["wallet_entry_type"]
          id?: number
          memo?: string | null
          ref_id?: string | null
          ref_table?: string | null
          user_id: string
        }
        Update: {
          amount_minor?: number
          balance_after_minor?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          entry_type?: Database["public"]["Enums"]["wallet_entry_type"]
          id?: number
          memo?: string | null
          ref_id?: string | null
          ref_table?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "wallet_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "wallet_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_downline: {
        Row: {
          ancestor_id: string | null
          avatar_url: string | null
          country_code: string | null
          depth: number | null
          display_name: string | null
          joined_at: string | null
          joined_month: string | null
          member_id: string | null
          rank_id: number | null
          rank_name: string | null
          status: Database["public"]["Enums"]["account_status"] | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_edges_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "my_downline"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "referral_edges_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_set_member_plan: {
        Args: { p_member: string; p_plan: number; p_status: string; p_reason: string; p_actor: string }
        Returns: string
      }
      admin_update_member_sponsor: {
        Args: { p_member: string; p_sponsor: string | null }
        Returns: undefined
      }
      advance_seasons: { Args: never; Returns: number }
      award_commissions: { Args: { p_payment_id: string }; Returns: number }
      award_leaderboard_points: {
        Args: { p_payment_id: string }
        Returns: number
      }
      award_retention_points: { Args: never; Returns: number }
      clear_commissions: { Args: never; Returns: number }
      confirm_declaration: {
        Args: { p_declaration: string; p_reviewer: string }
        Returns: string
      }
      expire_overdue_claims: { Args: never; Returns: number }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: { check_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      pay_level_rewards: { Args: never; Returns: number }
      post_wallet_entry: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_memo?: string
          p_ref_id?: string
          p_ref_table?: string
          p_type: Database["public"]["Enums"]["wallet_entry_type"]
          p_user: string
        }
        Returns: number
      }
      recompute_all_ranks: { Args: never; Returns: number }
      recompute_commission_eligibility: { Args: never; Returns: number }
      recompute_rank: { Args: { p_user: string }; Returns: number }
      record_payment: {
        Args: {
          p_fee_minor?: number
          p_gross_minor: number
          p_plan: number
          p_provider?: string
          p_provider_ref?: string
          p_tax_minor?: number
          p_user: string
        }
        Returns: string
      }
      refresh_leaderboard: { Args: { p_season: number }; Returns: number }
      refresh_live_leaderboards: { Args: never; Returns: number }
      refund_payment: {
        Args: { p_payment_id: string; p_reason?: string }
        Returns: undefined
      }
      reverse_commissions: {
        Args: { p_payment_id: string; p_reason?: string }
        Returns: number
      }
      wallet_balance: { Args: { p_user: string }; Returns: number }
      write_audit: {
        Args: {
          p_action: string
          p_after?: Json
          p_before?: Json
          p_id?: string
          p_table?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_status:
        | "pending"
        | "active"
        | "restricted"
        | "suspended"
        | "closed"
      app_role:
        | "member"
        | "reviewer"
        | "support"
        | "finance"
        | "admin"
        | "owner"
      award_status:
        | "pending_verification"
        | "verified"
        | "accepted"
        | "cash_taken"
        | "fulfilled"
        | "forfeited"
      billing_interval: "month" | "year"
      claim_status:
        | "active"
        | "submitted"
        | "in_review"
        | "revision"
        | "approved"
        | "rejected"
        | "expired"
        | "withdrawn"
      commission_applies_to: "first" | "renewal" | "both"
      commission_status:
        | "pending"
        | "review"
        | "available"
        | "paid"
        | "reversed"
        | "void"
      compliance_flag: "standard" | "tutoring" | "restricted"
      declaration_status: "submitted" | "confirmed" | "rejected" | "cancelled"
      fraud_severity: "low" | "medium" | "high"
      fraud_state: "open" | "reviewing" | "confirmed" | "dismissed"
      kyc_status: "none" | "pending" | "verified" | "rejected"
      payment_status:
        | "pending"
        | "succeeded"
        | "refunded"
        | "partially_refunded"
        | "disputed"
        | "failed"
      payout_status:
        | "requested"
        | "approved"
        | "processing"
        | "paid"
        | "failed"
        | "cancelled"
      points_reason:
        | "referral_signup"
        | "retention_90d"
        | "task_approved"
        | "reversal"
        | "adjustment"
      review_decision: "approve" | "revise" | "reject"
      season_status: "upcoming" | "live" | "closed" | "settled" | "awarded"
      season_track: "pk" | "uk" | "global"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "paused"
        | "cancelled"
        | "expired"
      task_status:
        | "draft"
        | "scheduled"
        | "open"
        | "full"
        | "in_review"
        | "completed"
        | "cancelled"
        | "expired"
      ticket_status: "open" | "pending" | "resolved" | "closed"
      wallet_entry_type:
        | "commission"
        | "task_payment"
        | "prize"
        | "bonus"
        | "payout"
        | "reversal"
        | "adjustment"
        | "fee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: [
        "pending",
        "active",
        "restricted",
        "suspended",
        "closed",
      ],
      app_role: ["member", "reviewer", "support", "finance", "admin", "owner"],
      award_status: [
        "pending_verification",
        "verified",
        "accepted",
        "cash_taken",
        "fulfilled",
        "forfeited",
      ],
      billing_interval: ["month", "year"],
      claim_status: [
        "active",
        "submitted",
        "in_review",
        "revision",
        "approved",
        "rejected",
        "expired",
        "withdrawn",
      ],
      commission_applies_to: ["first", "renewal", "both"],
      commission_status: [
        "pending",
        "review",
        "available",
        "paid",
        "reversed",
        "void",
      ],
      compliance_flag: ["standard", "tutoring", "restricted"],
      declaration_status: ["submitted", "confirmed", "rejected", "cancelled"],
      fraud_severity: ["low", "medium", "high"],
      fraud_state: ["open", "reviewing", "confirmed", "dismissed"],
      kyc_status: ["none", "pending", "verified", "rejected"],
      payment_status: [
        "pending",
        "succeeded",
        "refunded",
        "partially_refunded",
        "disputed",
        "failed",
      ],
      payout_status: [
        "requested",
        "approved",
        "processing",
        "paid",
        "failed",
        "cancelled",
      ],
      points_reason: [
        "referral_signup",
        "retention_90d",
        "task_approved",
        "reversal",
        "adjustment",
      ],
      review_decision: ["approve", "revise", "reject"],
      season_status: ["upcoming", "live", "closed", "settled", "awarded"],
      season_track: ["pk", "uk", "global"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "paused",
        "cancelled",
        "expired",
      ],
      task_status: [
        "draft",
        "scheduled",
        "open",
        "full",
        "in_review",
        "completed",
        "cancelled",
        "expired",
      ],
      ticket_status: ["open", "pending", "resolved", "closed"],
      wallet_entry_type: [
        "commission",
        "task_payment",
        "prize",
        "bonus",
        "payout",
        "reversal",
        "adjustment",
        "fee",
      ],
    },
  },
} as const
