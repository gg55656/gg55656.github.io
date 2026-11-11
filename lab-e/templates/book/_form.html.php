<?php
    /** @var $book ?\App\Model\Book */
?>

<div class="form-group">
    <label for="title">Title</label>
    <input type="text" id="title" name="book[title]" required value="<?= htmlspecialchars($book->getTitle() ?? "", ENT_QUOTES, "UTF-8") ?>">
</div>

<div class="form-group">
    <label for="author">Author</label>
    <input type="text" id="author" name="book[author]" value="<?= htmlspecialchars($book->getAuthor() ?? "", ENT_QUOTES, "UTF-8") ?>" required>
</div>

<div class="form-group">
    <label></label>
    <input type="submit" value="Submit">
</div>
