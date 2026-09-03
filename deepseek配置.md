
1,使用中转站的api：

curl https://www.177911.com/v1/chat/completions \
  -H "Authorization: Bearer  sk-vFz04qarXGfMEXBiO8shgmw8x6zHpX4Nf9G5llFZoMRPBSY9" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/deepseek-v4-flash-0731",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'


