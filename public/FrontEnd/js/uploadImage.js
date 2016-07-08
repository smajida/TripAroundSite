<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
    $(document).ready(function() {

        $('#uploadForm2').submit(function() {
            $("#status").empty().text("File is uploading...");

            $(this).ajaxSubmit({

                error: function(xhr) {
                    status('Error: ' + xhr.status);
                },

                success: function(response) {
                    console.log(response)
                    $("#status").empty().text(response);
                }
            });

            return false;
        });
    });

<script src="http://cdnjs.cloudflare.com/ajax/libs/jquery.form/3.51/jquery.form.min.js"></script>
