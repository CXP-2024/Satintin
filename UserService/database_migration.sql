-- 数据库迁移脚本：修复message_box字段类型和数据格式
-- 执行前请备份数据库！

-- Step 1: 如果表已存在，先添加新的JSONB列
ALTER TABLE "userservice"."user_social_table" 
ADD COLUMN IF NOT EXISTS message_box_new JSONB DEFAULT '[]'::jsonb;

ALTER TABLE "userservice"."user_social_table" 
ADD COLUMN IF NOT EXISTS friend_list_new JSONB DEFAULT '[]'::jsonb;

ALTER TABLE "userservice"."user_social_table" 
ADD COLUMN IF NOT EXISTS black_list_new JSONB DEFAULT '[]'::jsonb;

-- Step 2: 迁移现有数据，将字符串转换为JSON
UPDATE "userservice"."user_social_table" 
SET message_box_new = CASE 
    WHEN message_box IS NULL OR message_box = '' THEN '[]'::jsonb
    WHEN message_box = '[]' THEN '[]'::jsonb
    ELSE 
        CASE 
            WHEN message_box::text ~ '^\[.*\]$' THEN message_box::jsonb
            ELSE '[]'::jsonb
        END
END;

UPDATE "userservice"."user_social_table" 
SET friend_list_new = CASE 
    WHEN friend_list IS NULL OR friend_list = '' THEN '[]'::jsonb
    WHEN friend_list = '[]' THEN '[]'::jsonb
    ELSE 
        CASE 
            WHEN friend_list::text ~ '^\[.*\]$' THEN friend_list::jsonb
            ELSE '[]'::jsonb
        END
END;

UPDATE "userservice"."user_social_table" 
SET black_list_new = CASE 
    WHEN black_list IS NULL OR black_list = '' THEN '[]'::jsonb
    WHEN black_list = '[]' THEN '[]'::jsonb
    ELSE 
        CASE 
            WHEN black_list::text ~ '^\[.*\]$' THEN black_list::jsonb
            ELSE '[]'::jsonb
        END
END;

-- Step 3: 删除旧列
ALTER TABLE "userservice"."user_social_table" DROP COLUMN IF EXISTS message_box;
ALTER TABLE "userservice"."user_social_table" DROP COLUMN IF EXISTS friend_list;
ALTER TABLE "userservice"."user_social_table" DROP COLUMN IF EXISTS black_list;

-- Step 4: 重命名新列
ALTER TABLE "userservice"."user_social_table" RENAME COLUMN message_box_new TO message_box;
ALTER TABLE "userservice"."user_social_table" RENAME COLUMN friend_list_new TO friend_list;
ALTER TABLE "userservice"."user_social_table" RENAME COLUMN black_list_new TO black_list;

-- Step 5: 添加约束
ALTER TABLE "userservice"."user_social_table" 
ALTER COLUMN message_box SET NOT NULL,
ALTER COLUMN friend_list SET NOT NULL,
ALTER COLUMN black_list SET NOT NULL;

-- 查询迁移结果
SELECT user_id, 
       friend_list, 
       black_list, 
       message_box,
       jsonb_typeof(friend_list) as friend_list_type,
       jsonb_typeof(black_list) as black_list_type,
       jsonb_typeof(message_box) as message_box_type
FROM "userservice"."user_social_table" 
LIMIT 5;
