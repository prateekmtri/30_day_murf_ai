def split_text(text: str, limit: int = 2900) -> list[str]:
    """Splits text into chunks for the Murf API, respecting sentence boundaries."""
    if len(text) <= limit:
        return [text]

    chunks = []
    while len(text) > limit:
        # Find the last period within the limit
        split_point = text.rfind('.', 0, limit)
        if split_point == -1:  # If no period, force split at the limit
            split_point = limit
        
        # Ensure the split point is correctly indexed
        chunk = text[:split_point + 1]
        chunks.append(chunk)
        text = text[split_point + 1:].lstrip()

    if text:
        chunks.append(text)
        
    return chunks