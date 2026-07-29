import { Effect } from "effect"
import type { DatabaseMigration } from "../migration"

export default {
  id: "20260730000000_eternal_memory_system",
  up(tx) {
    return Effect.gen(function* () {
      // ============================================
      // ETERNAL MEMORY SYSTEM v4 — Zero Forget
      // ============================================

      // 1. Knowledge Graph — AI যা জানে (entities + relationships)
      yield* tx.run(`
        CREATE TABLE IF NOT EXISTS knowledge_entity (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          importance INTEGER NOT NULL DEFAULT 5,
          access_count INTEGER NOT NULL DEFAULT 0,
          metadata TEXT NOT NULL DEFAULT '{}',
          time_created INTEGER NOT NULL,
          time_updated INTEGER NOT NULL,
          time_last_accessed INTEGER NOT NULL
        )
      `)

      // 2. Knowledge Relationships — entities এর মধ্যে সম্পর্ক
      yield* tx.run(`
        CREATE TABLE IF NOT EXISTS knowledge_relation (
          id TEXT PRIMARY KEY,
          from_entity_id TEXT NOT NULL,
          to_entity_id TEXT NOT NULL,
          relation_type TEXT NOT NULL,
          weight REAL NOT NULL DEFAULT 1.0,
          metadata TEXT NOT NULL DEFAULT '{}',
          time_created INTEGER NOT NULL,
          CONSTRAINT fk_from_entity FOREIGN KEY (from_entity_id) REFERENCES knowledge_entity(id) ON DELETE CASCADE,
          CONSTRAINT fk_to_entity FOREIGN KEY (to_entity_id) REFERENCES knowledge_entity(id) ON DELETE CASCADE
        )
      `)

      // 3. Entity Mentions — entities কখন কোথায় উল্লেখ হয়েছে
      yield* tx.run(`
        CREATE TABLE IF NOT EXISTS entity_mention (
          id TEXT PRIMARY KEY,
          entity_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          message_id TEXT NOT NULL,
          context TEXT NOT NULL DEFAULT '',
          time_created INTEGER NOT NULL,
          CONSTRAINT fk_mention_entity FOREIGN KEY (entity_id) REFERENCES knowledge_entity(id) ON DELETE CASCADE
        )
      `)

      // 4. Decisions — কেন কোনো decision নেওয়া হয়েছে
      yield* tx.run(`
        CREATE TABLE IF NOT EXISTS decision (
          id TEXT PRIMARY KEY,
          decision TEXT NOT NULL,
          reasoning TEXT NOT NULL DEFAULT '',
          alternatives TEXT NOT NULL DEFAULT '[]',
          outcome TEXT NOT NULL DEFAULT 'pending',
          impact_score INTEGER NOT NULL DEFAULT 5,
          session_id TEXT NOT NULL,
          time_created INTEGER NOT NULL,
          time_resolved INTEGER
        )
      `)

      // 5. Errors — প্রতিটি error/bug এর permanent record
      yield* tx.run(`
        CREATE TABLE IF NOT EXISTS error_record (
          id TEXT PRIMARY KEY,
          error_type TEXT NOT NULL,
          error_message TEXT NOT NULL DEFAULT '',
          stack_trace TEXT NOT NULL DEFAULT '',
          fix_applied TEXT NOT NULL DEFAULT '',
          fix_session_id TEXT NOT NULL DEFAULT '',
          occurrence_count INTEGER NOT NULL DEFAULT 1,
          severity TEXT NOT NULL DEFAULT 'medium',
          time_first_seen INTEGER NOT NULL,
          time_last_seen INTEGER NOT NULL
        )
      `)

      // 6. Patterns — Repeated patterns (AI যেভাবে কাজ করে)
      yield* tx.run(`
        CREATE TABLE IF NOT EXISTS learned_pattern (
          id TEXT PRIMARY KEY,
          pattern_type TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          frequency INTEGER NOT NULL DEFAULT 1,
          confidence_score INTEGER NOT NULL DEFAULT 5,
          example_sessions TEXT NOT NULL DEFAULT '[]',
          time_created INTEGER NOT NULL,
          time_last_seen INTEGER NOT NULL
        )
      `)

      // 7. Summaries — Hierarchical summaries (hourly → daily → weekly → monthly)
      yield* tx.run(`
        CREATE TABLE IF NOT EXISTS memory_summary (
          id TEXT PRIMARY KEY,
          time_range TEXT NOT NULL,
          time_start INTEGER NOT NULL,
          time_end INTEGER NOT NULL,
          content TEXT NOT NULL DEFAULT '',
          message_count INTEGER NOT NULL DEFAULT 0,
          importance_score INTEGER NOT NULL DEFAULT 5,
          time_created INTEGER NOT NULL
        )
      `)

      // 8. Temporal Index — সময় অনুযায়ী memory lookup
      yield* tx.run(`
        CREATE TABLE IF NOT EXISTS temporal_index (
          id TEXT PRIMARY KEY,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          time_point INTEGER NOT NULL,
          event_type TEXT NOT NULL,
          metadata TEXT NOT NULL DEFAULT '{}',
          CONSTRAINT fk_temporal_entity FOREIGN KEY (entity_id) REFERENCES knowledge_entity(id) ON DELETE CASCADE
        )
      `)

      // ============================================
      // INDEXES — Maximum search performance
      // ============================================

      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_entity_type ON knowledge_entity(entity_type)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_entity_importance ON knowledge_entity(importance DESC)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_entity_access ON knowledge_entity(access_count DESC)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_entity_time ON knowledge_entity(time_created)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_relation_from ON knowledge_relation(from_entity_id)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_relation_to ON knowledge_relation(to_entity_id)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_relation_type ON knowledge_relation(relation_type)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_entity_mention_entity ON entity_mention(entity_id)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_entity_mention_session ON entity_mention(session_id)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_decision_session ON decision(session_id)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_decision_outcome ON decision(outcome)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_error_record_type ON error_record(error_type)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_error_record_severity ON error_record(severity)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_learned_pattern_type ON learned_pattern(pattern_type)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_memory_summary_time ON memory_summary(time_start, time_end)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_temporal_index_time ON temporal_index(time_point)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_temporal_index_entity ON temporal_index(entity_id)`)
      yield* tx.run(`CREATE INDEX IF NOT EXISTS idx_temporal_index_type ON temporal_index(entity_type)`)
    })
  },
} satisfies DatabaseMigration.Migration
